// apps/api/src/routes/posts.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { createPostSchema } from '@repo/shared/post';

export const postsRouter: Router = Router();

postsRouter.post('/api/posts', async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'ValidationError', details: parsed.error.issues });
    return;
  }

  try {
    const post = await prisma.post.create({ data: parsed.data });
    res.status(201).json(post);
  } catch (err: any) {
    if (err.code === 'P2003') {
      res.status(404).json({ error: 'AuthorNotFound' });
      return;
    }
    console.error(`post creation failed: ${err.message}`);
    res.status(500).json({ error: 'InternalError' });
  }
});

postsRouter.get('/api/posts/:id', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
  });

  if (!post) {
    res.status(404).json({ error: 'PostNotFound' });
    return;
  }

  res.status(200).json(post);
});