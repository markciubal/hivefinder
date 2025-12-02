// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Some example clubs – tweak these however you like
  const exampleClubs = [
    {
      name: 'Computer Science Club',
      description: 'Coding projects, hackathons, interview prep, and tech talks.',
      categories: ['Academic', 'STEM'],
      fieldsOfStudy: ['Computer Science', 'Software Engineering'],
      points: 95,
      clubUrl: 'https://example.com/cs-club',
    },
    {
      name: 'Music Appreciation Society',
      description: 'Jam sessions, concerts, and music discussion.',
      categories: ['Arts', 'Recreation'],
      fieldsOfStudy: ['Music'],
      points: 78,
      clubUrl: 'https://example.com/music-society',
    },
    {
      name: 'Community Service Club',
      description: 'Volunteer work and service projects around campus and town.',
      categories: ['Service'],
      fieldsOfStudy: ['Sociology', 'Public Policy'],
      points: 88,
      clubUrl: 'https://example.com/service-club',
    },
    {
      name: 'Robotics & Engineering Club',
      description: 'Robotics competitions, hardware builds, and Arduino fun.',
      categories: ['Academic', 'STEM'],
      fieldsOfStudy: ['Mechanical Engineering', 'Electrical Engineering'],
      points: 90,
      clubUrl: 'https://example.com/robotics-club',
    },
    {
      name: 'Esports & Gaming Club',
      description: 'Competitive and casual gaming, tournaments, and watch parties.',
      categories: ['Recreation'],
      fieldsOfStudy: ['Computer Science', 'Media Studies'],
      points: 82,
      clubUrl: 'https://example.com/esports-club',
    },
  ];

  console.log('Seeding example clubs…');

  for (const club of exampleClubs) {
    // Simple create – if you re-run this, you may get duplicates.
    // That’s fine for quick testing; we can make it smarter later.
    await prisma.club.create({
      data: {
        name: club.name,
        description: club.description,
        categories: club.categories,
        fieldsOfStudy: club.fieldsOfStudy,
        points: club.points,
        clubUrl: club.clubUrl,
      },
    });
  }

  console.log('Done seeding clubs ✅');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
