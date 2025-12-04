// prisma/seedClubs.js
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding clubs from JSON...");

  // Load clubs.json
  const filePath = path.join(process.cwd(), "utilities", "clubs.json");
  const fileContents = fs.readFileSync(filePath, "utf-8");

  let clubs = [];
  try {
    clubs = JSON.parse(fileContents);
  } catch (err) {
    console.error("❌ Failed to parse clubs.json:", err);
    process.exit(1);
  }

  if (!Array.isArray(clubs)) {
    console.error("❌ Expected clubs.json to export an array.");
    process.exit(1);
  }

  for (const club of clubs) {
    try {
      const existing = await prisma.club.findFirst({
        where: { name: club.name },
      });

      if (existing) {
        console.log(`↪ Skipped (already exists): ${club.name}`);
        continue;
      }

      await prisma.club.create({
        data: {
          name: club.name,
          description: club.description || "",
          categories: club.categories || [],
          fieldsOfStudy: club.fieldsOfStudy || [],
          points: typeof club.points === "number" ? club.points : null,
          clubUrl: club.clubUrl || null,
        },
      });

      console.log(`✅ Inserted: ${club.name}`);
    } catch (err) {
      console.error(`❌ Error inserting ${club.name}:`, err);
    }
  }

  console.log("🌱 Club seeding complete.");
}

main()
  .catch((err) => {
    console.error("❌ Seed error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
