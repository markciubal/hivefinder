// prisma/dropEmails.js
//
// Stop storing email addresses.
//
// Accounts are a username and a password now. Removing `email` from the Prisma
// schema stops new writes, but it does not touch what is already in Mongo, and
// it leaves two things that will bite:
//
//   1. The unique index User_email_key. Mongo treats a missing field as null,
//      so with that index in place the SECOND user created without an email
//      fails with a duplicate key error. Registration would break entirely.
//
//   2. Users with no username. Username is required and unique now, and it is
//      the only way to log in - a row without one cannot be read by Prisma and
//      belongs to someone with no way back into their account. Each one gets a
//      username derived from its email local-part before the address goes.
//
// Also unsets the password-reset columns (resetToken, resetExpires,
// resetLastSent): reset-by-email is gone, and a live token left in the
// database is a credential nobody is watching.
//
//   node prisma/dropEmails.js --dry    # report only
//   node prisma/dropEmails.js          # apply
//
// Run this BEFORE `prisma db push`, while the old rows still read. Idempotent:
// safe to re-run.

import "dotenv/config";
import { MongoClient } from "mongodb";

const DRY_RUN = process.argv.includes("--dry");

/** Same shape the app enforces: see lib/username.js. */
function usernameFromEmail(email, fallback) {
  const local = String(email || "").split("@")[0];
  const cleaned = local
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);
  return cleaned.length >= 3 ? cleaned : fallback;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Put it in .env at the project root.");
    process.exit(1);
  }

  const client = new MongoClient(url);
  await client.connect();

  try {
    const users = client.db().collection("User");

    const total = await users.countDocuments({});
    const withEmail = await users.countDocuments({ email: { $exists: true } });
    const withTokens = await users.countDocuments({
      resetToken: { $exists: true, $ne: null },
    });

    console.log(`Users:                 ${total}`);
    console.log(`  with an email:       ${withEmail}`);
    console.log(`  with a live reset token: ${withTokens}`);

    // --- 1. Anyone missing a username needs one before the address goes. ---

    const nameless = await users
      .find({ $or: [{ username: { $exists: false } }, { username: null }, { username: "" }] })
      .project({ _id: 1, email: 1 })
      .toArray();

    // Compare case-insensitively: the app refuses names that collide that way,
    // and two accounts differing only in case cannot both log in.
    const taken = new Set(
      (await users.find({}).project({ username: 1 }).toArray())
        .map((u) => String(u.username || "").toLowerCase())
        .filter(Boolean)
    );

    const renames = [];
    for (const u of nameless) {
      const base = usernameFromEmail(u.email, `member${String(u._id).slice(-6)}`);
      let candidate = base;
      let n = 2;
      while (taken.has(candidate.toLowerCase())) {
        candidate = `${base.slice(0, 29)}${n}`;
        n += 1;
      }
      taken.add(candidate.toLowerCase());
      renames.push({ _id: u._id, username: candidate });
    }

    if (renames.length > 0) {
      console.log(`\n  ${renames.length} user(s) have no username and will be given one:`);
      for (const r of renames.slice(0, 20)) {
        console.log(`    ${r._id} -> ${r.username}`);
      }
      if (renames.length > 20) console.log(`    ... and ${renames.length - 20} more`);
      console.log("\n  These people have no idea what their new username is, and");
      console.log("  there is no email to tell them. Keep this list.");
    }

    if (DRY_RUN) {
      console.log("\nDry run - nothing written.");
      return;
    }

    for (const r of renames) {
      await users.updateOne({ _id: r._id }, { $set: { username: r.username } });
    }

    // --- 2. Drop the addresses and the reset columns. ---

    const cleared = await users.updateMany(
      {
        $or: [
          { email: { $exists: true } },
          { resetToken: { $exists: true } },
          { resetExpires: { $exists: true } },
          { resetLastSent: { $exists: true } },
        ],
      },
      {
        $unset: {
          email: "",
          resetToken: "",
          resetExpires: "",
          resetLastSent: "",
        },
      }
    );
    console.log(`\nCleared email/reset fields from ${cleared.modifiedCount} user(s).`);

    // --- 3. Drop the unique index, or registration breaks on user two. ---

    const indexes = await users.indexes();
    const emailIndex = indexes.find((i) => i.key && "email" in i.key);
    if (emailIndex) {
      await users.dropIndex(emailIndex.name);
      console.log(`Dropped index ${emailIndex.name}.`);
    } else {
      console.log("No email index to drop.");
    }

    const left = await users.countDocuments({ email: { $exists: true } });
    console.log(`\nDone. Users still holding an email: ${left}`);
    console.log("Now run `npx prisma db push` to sync the schema.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
