// packages/shared/src/feed.ts
import { z } from 'zod';

export const feedQuerySchema = z.object({
  cursor: z
    .string()
    .regex(/^\d+$/, 'cursor must be a numeric offset')
    .optional(),
});

export const feedPostSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  authorId: z.uuid(),
  createdAt: z.iso.datetime(),
  author: z.object({
    id: z.uuid(),
    username: z.string(),
  }),
});

export const feedResponseSchema = z.object({
  posts: z.array(feedPostSchema),
  nextCursor: z.string().nullable(),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type FeedPost = z.infer<typeof feedPostSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;