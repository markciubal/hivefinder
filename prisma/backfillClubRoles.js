// prisma/backfillClubRoles.js
//
// One-time migration for per-club roles.
//
// Two things need fixing in existing data:
//
//  1. `Member.role` is a required enum. Prisma's MongoDB connector does not
//     backfill defaults into documents that already exist - it throws
//     "Missing a required value" when it reads one. Every membership created
//     before this change has no role, so /myClubs, join status and the roster
//     all fail until they are stamped.
//
//  2. Officership used to live in a separate ClubModerator collection. Worse,
//     the old create-club route wrote ONLY a ClubModerator row, never a Member
//     row - so everyone who created a hive before this change is its moderator
//     but not its member. Those people need a Member row with role OFFICER, or
//     they lose control of the hive they made.
//
// Uses the raw driver because Prisma cannot read the documents it needs to fix.
//
//   node prisma/backfillClubRoles.js          # apply
//   node prisma/backfillClubRoles.js --dry    # report only
//
// Idempotent. The ClubModerator collection is left in place - drop it by hand
// once you are satisfied the migration is correct.

import "dotenv/config";
import { MongoClient } from "mongodb";

const DRY_RUN = process.argv.includes("--dry");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Put it in .env at the project root.");
    process.exit(1);
  }

  const client = new MongoClient(url);
  await client.connect();

  try {
    const db = client.db();
    const members = db.collection("Member");
    const moderators = db.collection("ClubModerator");

    // --- Step 1: stamp role on memberships that have none. -----------------
    const roleless = await members.countDocuments({ role: { $exists: false } });
    console.log(`Memberships with no role: ${roleless}`);

    // --- Step 2: fold ClubModerator rows into Member. ----------------------
    const mods = await moderators.find({}).toArray();
    console.log(`ClubModerator rows to fold in: ${mods.length}`);

    let promote = 0;
    let create = 0;
    const toCreate = [];
    const toPromote = [];

    for (const mod of mods) {
      const existing = await members.findOne({
        userId: mod.userId,
        clubId: mod.clubId,
      });

      if (existing) {
        if (existing.role !== "OFFICER") {
          toPromote.push(existing._id);
          promote++;
        }
      } else {
        // The creator-without-membership case described above.
        toCreate.push({
          userId: mod.userId,
          clubId: mod.clubId,
          role: "OFFICER",
          joinedAt: mod.assignedAt || new Date(),
        });
        create++;
      }
    }

    console.log(`  existing members to promote to OFFICER: ${promote}`);
    console.log(`  officers with no membership (will be created): ${create}`);

    if (DRY_RUN) {
      console.log("\nDry run - nothing written.");
      return;
    }

    // Order matters: stamp MEMBER first, then promote, so a promoted row is
    // never overwritten back to MEMBER.
    if (roleless > 0) {
      await members.updateMany(
        { role: { $exists: false } },
        { $set: { role: "MEMBER" } }
      );
    }
    if (toPromote.length > 0) {
      await members.updateMany(
        { _id: { $in: toPromote } },
        { $set: { role: "OFFICER" } }
      );
    }
    if (toCreate.length > 0) {
      await members.insertMany(toCreate);
    }

    // --- Step 3: warn about clubs nobody can administer. ------------------
    // Official clubs are expected to have no officers until someone claims
    // them; a *hive* with no officer is a problem.
    const officeredClubIds = await members.distinct("clubId", { role: "OFFICER" });
    const orphanHives = await db
      .collection("Club")
      .find({ kind: "HIVE", _id: { $nin: officeredClubIds } })
      .project({ name: 1 })
      .toArray();

    if (orphanHives.length > 0) {
      console.log(
        `\n  ${orphanHives.length} hive(s) have no officer and cannot post events:`
      );
      orphanHives.forEach((h) => console.log(`    - ${h.name}`));
      console.log(
        "  A site moderator can promote someone at /clubs/<id>/members - " +
          "moderators bypass the officer check there."
      );
    }

    console.log("\nBackfill complete.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
