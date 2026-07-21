// apps/api/src/routes/posts.ts
import { Router } from 'express';
import { createPostSchema } from '@repo/shared/post';
import * as postService from '../services/post.service.js';
import { AuthorNotFoundError, PostNotFoundError } from '../lib/errors.js';

export const postsRouter: Router = Router();

postsRouter.post('/api/posts', async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'ValidationError', details: parsed.error.issues });
    return;
  }

  try {
    const post = await postService.createPost(parsed.data);
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
