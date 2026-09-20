// prisma/purgeOfficialClubs.js
//
// Clean break from official clubs.
//
// Recognized Sacramento State organizations are handled entirely by
// CampusGroups now: /clubPage redirects there, joining and event-posting for
// them are refused by the API, and they are no longer seeded. This removes the
// rows left over from when HiveFinder mirrored them.
//
// Removed, in dependency order:
//   EventInterest -> Event -> Member -> Club, for every club with kind OFFICIAL
//
// Flags that point at a purged club are LEFT ALONE on purpose. Each one stored
// a targetLabel when it was filed, so the moderation queue still reads
// sensibly, and deleting the report because the subject is gone would erase
// the record of a decision.
//
// utilities/clubs.json stays in the repo. It is no longer seed data: it is the
// reserved-name list that stops a hive calling itself "Sac State Robotics"
// (lib/reservedNames.js). Do not delete it.
//
//   node prisma/purgeOfficialClubs.js --dry    # report only
//   node prisma/purgeOfficialClubs.js          # apply
//
// Idempotent. Safe to re-run.

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

    const official = await db
      .collection("Club")
      .find({ kind: "OFFICIAL" })
      .project({ _id: 1, name: 1 })
      .toArray();

    if (official.length === 0) {
      console.log("No official clubs in the database. Nothing to do.");
      return;
    }

    const clubIds = official.map((c) => c._id);

    const events = await db
      .collection("Event")
      .find({ clubId: { $in: clubIds } })
      .project({ _id: 1 })
      .toArray();
    const eventIds = events.map((e) => e._id);

    const memberCount = await db
      .collection("Member")
      .countDocuments({ clubId: { $in: clubIds } });
    const interestCount = eventIds.length
      ? await db
          .collection("EventInterest")
          .countDocuments({ eventId: { $in: eventIds } })
      : 0;

    console.log(`Official clubs:      ${official.length}`);
    console.log(`  memberships:       ${memberCount}`);
    console.log(`  events:            ${eventIds.length}`);
    console.log(`  event interests:   ${interestCount}`);

    // Friend Finder matches partly on shared club membership, so removing
    // these changes who people are matched with. Worth saying out loud.
    if (memberCount > 0) {
      console.log(
        `\n  Note: ${memberCount} membership(s) will disappear from Friend Finder's`
      );
      console.log("  matching. Hive memberships are unaffected.");
    }

    if (DRY_RUN) {
      console.log("\nDry run - nothing written.");
      return;
    }

    if (eventIds.length > 0) {
      await db
        .collection("EventInterest")
        .deleteMany({ eventId: { $in: eventIds } });
      await db.collection("Event").deleteMany({ _id: { $in: eventIds } });
    }
    await db.collection("Member").deleteMany({ clubId: { $in: clubIds } });
    await db.collection("Club").deleteMany({ _id: { $in: clubIds } });

    const left = await db.collection("Club").countDocuments({ kind: "OFFICIAL" });
    console.log(`\nPurge complete. Official clubs remaining: ${left}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Purge failed:", err);
  process.exit(1);
});
