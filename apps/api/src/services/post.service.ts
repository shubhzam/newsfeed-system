// apps/api/src/services/post.service.ts
import { prisma } from '../lib/prisma.js';
import { AuthorNotFoundError, PostNotFoundError } from '../lib/errors.js';

export async function createPost(data: { authorId: string; content: string }) {
  try {
    return await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({ data });

      // outbox write, same transaction as the post insert - both commit
      // together or neither does. the poller (a separate process) is the
      // only thing that ever actually talks to kafka now.
      await tx.outboxEvent.create({
        data: {
          eventType: 'post.created',
          payload: {
            postId: post.id,
            authorId: post.authorId,
            createdAt: post.createdAt.toISOString(),
          },
        },
      });

      return post;
    });
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