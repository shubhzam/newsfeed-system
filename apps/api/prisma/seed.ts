// apps/api/prisma/seed.ts
import bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  { username: 'alice', email: 'alice@example.com', password: 'password123' },
  { username: 'bob', email: 'bob@example.com', password: 'password123' },
  { username: 'carol', email: 'carol@example.com', password: 'password123' },
];

async function main() {
  const users = await Promise.all(
    SEED_USERS.map(async ({ username, email, password }) => {
      const passwordHash = await bcrypt.hash(password, 12);
      return prisma.user.upsert({
        where: { username },
        update: {},
        create: { username, email, passwordHash },
      });
    }),
  );
  console.log(`seeded ${users.length} users:`, users.map((u) => u.username));
  console.log('all seeded users share password: password123');
}

main()
  .catch((err) => {
    console.error(`seed failed: ${(err as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());