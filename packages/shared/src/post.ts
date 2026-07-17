// packages/shared/src/post.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  authorId: z.uuid(),
  content: z.string().trim().min(1).max(5000),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;