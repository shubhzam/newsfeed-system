// apps/api/src/services/follow.service.ts
import { prisma } from '../lib/prisma.js';
import {
  SelfFollowError,
  AlreadyFollowingError,
  NotFollowingError,
  UserNotFoundError,
} from '../lib/errors.js';

export async function createFollow(followerId: string, followeeId: string) {
  if (followerId === followeeId) {
    throw new SelfFollowError();
  }

  try {
    // interactive transaction: the follow row and the counter increment either both
    // land or neither does. using the callback form (not the array form) also means
    // if the follow.create fails, the update never even runs - no race against
    // incrementing a count for a follow that doesn't exist
    return await prisma.$transaction(async (tx) => {
      const follow = await tx.follow.create({ data: { followerId, followeeId } });
      await tx.user.update({
        where: { id: followeeId },
        data: { followerCount: { increment: 1 } },
      });
      return follow;
    });
  } catch (err: any) {
    if (err.code === 'P2002') throw new AlreadyFollowingError();
    if (err.code === 'P2003') throw new UserNotFoundError();
    throw err;
  }
}

export async function deleteFollow(followerId: string, followeeId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.follow.delete({
        where: { followerId_followeeId: { followerId, followeeId } },
      });
      await tx.user.update({
        where: { id: followeeId },
        data: { followerCount: { decrement: 1 } },
      });
    });
  } catch (err: any) {
    if (err.code === 'P2025') throw new NotFollowingError();
    throw err;
  }
}

export async function listFollowees(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { followee: true },
  });
  return follows.map((f) => f.followee);
}

export async function listFollowers(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followeeId: userId },
    include: { follower: true },
  });
  return follows.map((f) => f.follower);
}