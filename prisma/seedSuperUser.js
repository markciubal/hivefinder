// prisma/seedSuperuser.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Keyed on username: accounts have no email address any more, so the
  // username is the identity and the thing to upsert against.
  const username = process.env.SUPERUSER_USERNAME || "HiveQueenOmega";
  const plainPassword =
    process.env.SUPERUSER_PASSWORD || "HiveQueenOmega!123";

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const superuser = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: "SUPERUSER",
      firstName: "Hive",
      lastName: "Queen",
    },
    create: {
      username,
      password: hashedPassword,
      role: "SUPERUSER",
      firstName: "Hive",
      lastName: "Queen",
      interests: [],
    },
  });

  console.log("Seeded SUPERUSER account:");
  console.log(`  username: ${superuser.username}`);
  console.log(`  password: ${plainPassword}`);
  console.log("\nThere is no password reset - write this down.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
