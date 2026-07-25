// apps/api/src/services/post.service.ts
import { prisma } from '../lib/prisma.js';
import { kafkaProducer } from '../lib/kafka.js';
import { AuthorNotFoundError, PostNotFoundError } from '../lib/errors.js';

export async function createPost(data: { authorId: string; content: string }) {
  let post;
  try {
    post = await prisma.post.create({ data });
  } catch (err: any) {
    if (err.code === 'P2003') throw new AuthorNotFoundError();
    throw err;
  }

  try {
    await kafkaProducer.send({
      topic: 'posts',
      messages: [
        {
          value: JSON.stringify({
            postId: post.id,
            authorId: post.authorId,
            createdAt: post.createdAt.toISOString(),
          }),
        },
      ],
    });
  } catch (err) {
    console.error(`failed to publish post.created event: ${(err as Error).message}`);
  }

  return post;
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    throw new PostNotFoundError();
  }
  return post;
}