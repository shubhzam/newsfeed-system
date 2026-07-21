// apps/api/src/routes/users.ts
import { Router } from 'express';
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

  try {
    const follow = await followService.createFollow(userIdResult.data, bodyResult.data.followeeId);
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
    await followService.deleteFollow(followerIdResult.data, followeeIdResult.data);
    res.status(204).send();
  } catch (err) {
    if (err instanceof NotFollowingError) {
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

usersRouter.get('/api/users/:userId/feed', async (req, res) => {
  const userIdResult = z.uuid().safeParse(req.params.userId);
  const queryResult = feedQuerySchema.safeParse(req.query);

  if (!userIdResult.success || !queryResult.success) {
    res.status(400).json({
      error: 'ValidationError',
      details: [
        ...(userIdResult.success ? [] : userIdResult.error.issues),
        ...(queryResult.success ? [] : queryResult.error.issues),
      ],
    });
    return;
  }

  try {
    const feed = await feedService.getUserFeed(userIdResult.data, queryResult.data.cursor);
    res.status(200).json(feed);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      res.status(404).json({ error: 'UserNotFound' });
      return;
    }
    throw err;
  }
});
