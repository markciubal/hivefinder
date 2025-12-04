// prisma/seedSuperuser.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email =
    process.env.SUPERUSER_EMAIL || "hivequeen.omega@hivefinder.local";
  const plainPassword =
    process.env.SUPERUSER_PASSWORD || "HiveQueenOmega!123";

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const superuser = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "SUPERUSER",
      username: "HiveQueenOmega",
      firstName: "Hive",
      lastName: "Queen",
    },
    create: {
      email,
      password: hashedPassword,
      role: "SUPERUSER",
      username: "HiveQueenOmega",
      firstName: "Hive",
      lastName: "Queen",
      interests: [],
    },
  });

  console.log("Seeded SUPERUSER account:");
  console.log(`  email:    ${superuser.email}`);
  console.log(`  username: ${superuser.username}`);
  console.log(`  password: ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
