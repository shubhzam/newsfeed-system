// packages/shared/src/feed.ts
import { z } from 'zod';

export const feedQuerySchema = z.object({
  cursor: z
    .string()
    .regex(/^\d+$/, 'cursor must be a numeric offset')
    .optional(),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;