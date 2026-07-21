// packages/shared/src/feed.ts
import { z } from 'zod';

export const feedQuerySchema = z.object({
  cursor: z.iso.datetime().optional(),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;