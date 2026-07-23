// apps/api/src/routes/posts.ts
import { Router, type Request } from 'express';
import { createPostSchema } from '@repo/shared/post';
import * as postService from '../services/post.service.js';
import { AuthorNotFoundError, PostNotFoundError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const postsRouter: Router = Router();

postsRouter.post('/api/posts', requireAuth, async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'ValidationError', details: parsed.error.issues });
    return;
  }

  const auth = (req as Request & { auth: { userId: string } }).auth;

  try {
    const post = await postService.createPost({
      authorId: auth.userId,
      content: parsed.data.content,
    });
    res.status(201).json(post);
  } catch (err) {
    if (err instanceof AuthorNotFoundError) {
      res.status(404).json({ error: 'AuthorNotFound' });
      return;
    }
    throw err;
  }
});

postsRouter.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      res.status(404).json({ error: 'PostNotFound' });
      return;
    }
    throw err;
  }
});