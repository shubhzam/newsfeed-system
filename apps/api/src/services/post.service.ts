// apps/api/src/services/post.service.ts
import { prisma } from '../lib/prisma.js';
import type { CreatePostInput } from '@repo/shared/post';
import { AuthorNotFoundError, PostNotFoundError } from '../lib/errors.js';

export async function createPost(data: CreatePostInput) {
  try {
    return await prisma.post.create({ data });
  } catch (err: any) {
    if (err.code === 'P2003') throw new AuthorNotFoundError();
    throw err;
  }
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    throw new PostNotFoundError();
  }
  return post;
}
