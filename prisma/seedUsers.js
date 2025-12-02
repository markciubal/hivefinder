// prisma/seedUsers.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding users with interests…');

  // Same password for all demo users
  const passwordHash = await bcrypt.hash('password123', 10);

  const exampleUsers = [
    {
      username: 'alice',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Kim',
      about: 'CS student who loves hackathons and late-night coding.',
      interests: ['Coding', 'Hackathons', 'Robotics', 'Gaming'],
    },
    {
      username: 'bob',
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Martinez',
      about: 'Mechanical engineering major into robotics and men’s soccer.',
      interests: ['Robotics', 'Soccer', '3D Printing'],
    },
    {
      username: 'chloe',
      email: 'chloe@example.com',
      firstName: 'Chloe',
      lastName: 'Nguyen',
      about: 'Music lover who spends weekends volunteering.',
      interests: ['Music', 'Volunteering', 'Community Service'],
    },
    {
      username: 'derek',
      email: 'derek@example.com',
      firstName: 'Derek',
      lastName: 'Johnson',
      about: 'Esports and streaming addict, future media studies major.',
      interests: ['Gaming', 'Esports', 'Streaming', 'Media'],
    },
  ];

  for (const u of exampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email }, // email is unique in your schema
      update: {
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        about: u.about,
        interests: u.interests,
        password: passwordHash,
      },
      create: {
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        about: u.about,
        interests: u.interests,
        password: passwordHash,
      },
    });

    console.log(`Upserted user ${user.email}`);
  }

  console.log('Done seeding users ✅');
}

main()
  .catch((e) => {
    console.error('Seed users error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
