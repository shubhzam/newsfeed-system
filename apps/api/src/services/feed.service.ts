// apps/api/src/services/feed.service.ts
import { prisma } from '../lib/prisma.js';
import { redisClient } from '../lib/redis.js';
import { UserNotFoundError } from '../lib/errors.js';

const FEED_PAGE_SIZE = 20;
const FEED_CACHE_TTL_SECONDS = 30;

export async function getUserFeed(userId: string, cursor: string | undefined) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UserNotFoundError();
  }

  const isPageOne = cursor === undefined;
  const cacheKey = `feed:${userId}:page1`;

  if (isPageOne) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error(`feed cache read failed, falling back to db: ${(err as Error).message}`);
    }
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followeeId: true },
  });
  const followeeIds = follows.map((f) => f.followeeId);

  const result =
    followeeIds.length === 0
      ? { posts: [], nextCursor: null }
      : await buildFeedPage(followeeIds, cursor);

  if (isPageOne) {
    try {
      await redisClient.setEx(cacheKey, FEED_CACHE_TTL_SECONDS, JSON.stringify(result));
    } catch (err) {
      console.error(`feed cache write failed: ${(err as Error).message}`);
    }
  }

  return result;
}

async function buildFeedPage(followeeIds: string[], cursor: string | undefined) {
  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: followeeIds },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: FEED_PAGE_SIZE,
    include: { author: { select: { id: true, username: true } } },
  });

  const lastPost = posts.at(-1);
  const nextCursor =
    posts.length === FEED_PAGE_SIZE && lastPost ? lastPost.createdAt.toISOString() : null;

  return { posts, nextCursor };
}