// apps/api/src/services/feed.service.ts
import { prisma } from '../lib/prisma.js';
import { UserNotFoundError } from '../lib/errors.js';

const FEED_PAGE_SIZE = 20;

export async function getUserFeed(userId: string, cursor: string | undefined) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UserNotFoundError();
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followeeId: true },
  });
  const followeeIds = follows.map((f) => f.followeeId);

  if (followeeIds.length === 0) {
    return { posts: [], nextCursor: null };
  }

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
