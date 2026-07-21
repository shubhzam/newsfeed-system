// apps/api/src/routes/users.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { createFollowSchema } from '@repo/shared/follow';
import { z } from 'zod';

export const usersRouter: Router = Router();

usersRouter.post('/api/users/:userId/following', async (req, res) => {
  const userIdResult = z.uuid().safeParse(req.params.userId);
  const bodyResult = createFollowSchema.safeParse(req.body);

  if (!userIdResult.success || !bodyResult.success) {
    res.status(400).json({
      error: 'ValidationError',
      details: [
        ...(userIdResult.success ? [] : userIdResult.error.issues),
        ...(bodyResult.success ? [] : bodyResult.error.issues),
      ],
    });
    return;
  }

  const followerId = userIdResult.data;
  const { followeeId } = bodyResult.data;

  if (followerId === followeeId) {
    res.status(400).json({ error: 'SelfFollow' });
    return;
  }

  try {
    const follow = await prisma.follow.create({
      data: { followerId, followeeId },
    });
    res.status(201).json(follow);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'AlreadyFollowing' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(404).json({ error: 'UserNotFound' });
      return;
    }
    throw err;
  }
});

usersRouter.delete('/api/users/:userId/following/:followeeId', async (req, res) => {
  const followerIdResult = z.uuid().safeParse(req.params.userId);
  const followeeIdResult = z.uuid().safeParse(req.params.followeeId);

  if (!followerIdResult.success || !followeeIdResult.success) {
res.status(400).json({
  error: 'ValidationError',
  details: [
    ...(followerIdResult.success ? [] : followerIdResult.error.issues),
    ...(followeeIdResult.success ? [] : followeeIdResult.error.issues),
  ],
  });
    return;
  }

  try {
    await prisma.follow.delete({
      where: {
        followerId_followeeId: {
          followerId: followerIdResult.data,
          followeeId: followeeIdResult.data,
        },
      },
    });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'NotFollowing' });
      return;
    }
    throw err;
  }
});

usersRouter.get('/api/users/:userId/following', async (req, res) => {
  const userIdResult = z.uuid().safeParse(req.params.userId);

  if (!userIdResult.success) {
    res.status(400).json({ error: 'ValidationError', details: userIdResult.error.issues });
    return;
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: userIdResult.data },
    include: { followee: true },
  });

  res.status(200).json(follows.map((f) => f.followee));
});

usersRouter.get('/api/users/:userId/followers', async (req, res) => {
  const userIdResult = z.uuid().safeParse(req.params.userId);

  if (!userIdResult.success) {
    res.status(400).json({ error: 'ValidationError', details: userIdResult.error.issues });
    return;
  }

  const follows = await prisma.follow.findMany({
    where: { followeeId: userIdResult.data },
    include: { follower: true },
  });

  res.status(200).json(follows.map((f) => f.follower));
});