// prisma/backfillClubKind.js
//
// One-time migration for the Clubs/Hives split.
//
// `Club.kind` is a required enum. Prisma's MongoDB connector does NOT backfill
// defaults into documents that already exist — it throws
// "Missing a required value" the first time it reads one. Any club created
// before this field existed therefore has to be stamped before the app will
// load its directory at all.
//
// Uses the raw driver rather than Prisma for exactly that reason: Prisma
// cannot read the documents it needs to fix.
//
//   node prisma/backfillClubKind.js          # apply
//   node prisma/backfillClubKind.js --dry    # report only
//
// Safe to run repeatedly; it only touches documents with no `kind`.

import "dotenv/config";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

const DRY_RUN = process.argv.includes("--dry");

const CAMPUS_HOSTS = ["csus.campusgroups.com", "campusgroups.com", "csus.edu"];

function isCampusDirectoryUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return CAMPUS_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Put it in .env at the project root."
    );
    process.exit(1);
  }

  // The canonical roster is the source of truth for what counts as OFFICIAL.
  const file = path.join(process.cwd(), "utilities", "clubs.json");
  const canonical = new Set(
    JSON.parse(fs.readFileSync(file, "utf-8")).map((c) => normalizeName(c.name))
  );
  console.log(`Loaded ${canonical.size} canonical club names.`);

  const client = new MongoClient(url);
  await client.connect();

  try {
    const clubs = client.db().collection("Club");

    const pending = await clubs
      .find({ kind: { $exists: false } })
      .project({ _id: 1, name: 1, clubUrl: 1, createdBy: 1 })
      .toArray();

    if (pending.length === 0) {
      console.log("Nothing to do — every club already has a kind.");
      return;
    }

    console.log(`${pending.length} club(s) need a kind.\n`);

    const official = [];
    const hives = [];

    for (const doc of pending) {
      // A club counts as OFFICIAL when it is in the seeded roster or carries a
      // campus directory URL. Anything a user made (createdBy set) is a hive
      // regardless, since the create API has always stamped that field.
      const madeByUser = Boolean(doc.createdBy);
      const looksOfficial =
        !madeByUser &&
        (canonical.has(normalizeName(doc.name)) ||
          isCampusDirectoryUrl(doc.clubUrl));

      (looksOfficial ? official : hives).push(doc);
    }

    console.log(`  OFFICIAL: ${official.length}`);
    console.log(`  HIVE:     ${hives.length}`);

    // Names worth eyeballing: user-made listings that borrowed an official
    // club's name are exactly the impersonation cases the split exists to stop.
    const impostors = hives.filter((d) => canonical.has(normalizeName(d.name)));
    if (impostors.length > 0) {
      console.log(
        `\n  ${impostors.length} user-created club(s) share an official name ` +
          `and will become hives:`
      );
      impostors.forEach((d) => console.log(`    - ${d.name}`));
    }

    if (DRY_RUN) {
      console.log("\nDry run — nothing written.");
      return;
    }

    if (official.length > 0) {
      await clubs.updateMany(
        { _id: { $in: official.map((d) => d._id) } },
        { $set: { kind: "OFFICIAL" } }
      );
    }
    if (hives.length > 0) {
      await clubs.updateMany(
        { _id: { $in: hives.map((d) => d._id) } },
        { $set: { kind: "HIVE" } }
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
