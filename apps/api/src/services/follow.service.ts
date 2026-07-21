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
    return await prisma.follow.create({ data: { followerId, followeeId } });
  } catch (err: any) {
    if (err.code === 'P2002') throw new AlreadyFollowingError();
    if (err.code === 'P2003') throw new UserNotFoundError();
    throw err;
  }
}

export async function deleteFollow(followerId: string, followeeId: string) {
  try {
    await prisma.follow.delete({
      where: { followerId_followeeId: { followerId, followeeId } },
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
