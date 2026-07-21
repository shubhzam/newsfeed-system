// packages/shared/src/follow.ts
import { z } from 'zod';

export const createFollowSchema = z.object({
  followeeId: z.uuid(),
});

export type CreateFollowInput = z.infer<typeof createFollowSchema>;