// packages/shared/src/post.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});
export const postSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  authorId: z.uuid(),
  createdAt: z.iso.datetime(),
});
export type Post = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;