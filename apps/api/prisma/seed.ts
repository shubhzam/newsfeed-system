// apps/api/prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await Promise.all(
    ['alice', 'bob', 'carol'].map((username) =>
      prisma.user.upsert({
        where: { username },
        update: {},
        create: { username },
      }),
    ),
  );
  console.log(`seeded ${users.length} users:`, users.map((u) => u.username));
}

main()
  .catch((err) => {
    console.error(`seed failed: ${(err as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());