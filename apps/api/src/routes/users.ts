// apps/api/src/routes/users.ts
import { Router, type Request } from 'express';
import { createFollowSchema } from '@repo/shared/follow';
import { feedQuerySchema } from '@repo/shared/feed';
import { z } from 'zod';
import * as followService from '../services/follow.service.js';
import * as feedService from '../services/feed.service.js';
import {
  SelfFollowError,
  AlreadyFollowingError,
  NotFollowingError,
  UserNotFoundError,
} from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const usersRouter: Router = Router();

usersRouter.post('/api/following', requireAuth, async (req, res) => {
  const bodyResult = createFollowSchema.safeParse(req.body);

  if (!bodyResult.success) {
    res.status(400).json({ error: 'ValidationError', details: bodyResult.error.issues });
    return;
  }

  const auth = (req as Request & { auth: { userId: string } }).auth;

  try {
    const follow = await followService.createFollow(auth.userId, bodyResult.data.followeeId);
    res.status(201).json(follow);
  } catch (err) {
    if (err instanceof SelfFollowError) {
      res.status(400).json({ error: 'SelfFollow' });
      return;
    }
    if (err instanceof AlreadyFollowingError) {
      res.status(409).json({ error: 'AlreadyFollowing' });
      return;
    }
    if (err instanceof UserNotFoundError) {
      res.status(404).json({ error: 'UserNotFound' });
      return;
    }
    throw err;
  }
});

usersRouter.delete('/api/following/:followeeId', requireAuth, async (req, res) => {
  const followeeIdResult = z.uuid().safeParse(req.params.followeeId);

  if (!followeeIdResult.success) {
    res.status(400).json({ error: 'ValidationError', details: followeeIdResult.error.issues });
    return;
  }

  const auth = (req as Request & { auth: { userId: string } }).auth;

  try {
    await followService.deleteFollow(auth.userId, followeeIdResult.data);
    res.status(204).send();
  } catch (err) {
    if (err instanceof NotFollowingError) {
      res.status(404).json({ error: 'NotFollowing' });
      return;
    }
    throw err;
  }
});

// unchanged, still public, no requireAuth:
usersRouter.get('/api/users/:userId/following', async (req, res) => {
  const userIdResult = z.uuid().safeParse(req.params.userId);

  if (!userIdResult.success) {
    res.status(400).json({ error: 'ValidationError', details: userIdResult.error.issues });
    return;
  }

  const followees = await followService.listFollowees(userIdResult.data);
  res.status(200).json(followees);
});

usersRouter.get('/api/users/:userId/followers', async (req, res) => {
  const userIdResult = z.uuid().safeParse(req.params.userId);

  if (!userIdResult.success) {
    res.status(400).json({ error: 'ValidationError', details: userIdResult.error.issues });
    return;
  }

  const followers = await followService.listFollowers(userIdResult.data);
  res.status(200).json(followers);
});

usersRouter.get('/api/feed', requireAuth, async (req, res) => {
  const queryResult = feedQuerySchema.safeParse(req.query);

  if (!queryResult.success) {
    res.status(400).json({ error: 'ValidationError', details: queryResult.error.issues });
    return;
  }

  const auth = (req as Request & { auth: { userId: string } }).auth;

  const feed = await feedService.getUserFeed(auth.userId, queryResult.data.cursor);
  res.status(200).json(feed);
});