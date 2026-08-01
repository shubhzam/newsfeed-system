// apps/api/src/scripts/backfill-follower-count.ts
// one-time backfill: recomputes followerCount for every user from existing
// Follow rows. run manually - never imported or called on app boot.
import 'dotenv/config';
import { prisma } from '../lib/prisma.js';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  console.log(`backfilling followerCount for ${users.length} users`);

  let updated = 0;
  for (const user of users) {
    const count = await prisma.follow.count({ where: { followeeId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { followerCount: count },
    });
    updated++;
  }

  console.log(`done - updated ${updated} users`);
}

main()
  .catch((err) => {
    console.error(`backfill failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());