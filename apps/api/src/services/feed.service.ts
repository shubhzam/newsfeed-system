// apps/api/src/services/feed.service.ts
import { prisma } from '../lib/prisma.js';
import { redisClient } from '../lib/redis.js';
import { UserNotFoundError } from '../lib/errors.js';

const FEED_PAGE_SIZE = 20;
const FEED_LIST_CAP = 500;

export async function getUserFeed(userId: string, cursor: string | undefined) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UserNotFoundError();
  }

  const key = `feed:user:${userId}`;
  const start = cursor ? Number(cursor) : 0;
  const end = start + FEED_PAGE_SIZE - 1;

  let listLength = await redisClient.lLen(key);
  if (listLength === 0) {
    listLength = await backfillFeed(userId, key);
  }

  const postIds = await redisClient.lRange(key, start, end);
  const posts = await hydratePosts(postIds);
  const nextCursor = end + 1 < listLength ? String(end + 1) : null;

  return { posts, nextCursor };
}

// Cold-start bridge: reuses the original fanout-on-read query so a feed list
// that predates this feature (or a brand-new user) still gets a correct result.
async function backfillFeed(userId: string, key: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followeeId: true },
  });
  const followeeIds = follows.map((f) => f.followeeId);

  const posts = await prisma.post.findMany({
    where: { OR: [{ authorId: { in: followeeIds } }, { authorId: userId }] },
    orderBy: { createdAt: 'desc' },
    take: FEED_LIST_CAP,
    select: { id: true },
  });

  for (const post of [...posts].reverse()) {
    await redisClient.lPush(key, post.id);
  }

  return posts.length;
}

async function hydratePosts(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }

  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    include: { author: { select: { id: true, username: true } } },
  });

  const byId = new Map(posts.map((p) => [p.id, p]));
  return postIds
    .map((id) => byId.get(id))
    .filter((post): post is (typeof posts)[number] => post !== undefined)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
