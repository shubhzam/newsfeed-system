// apps/api/src/lib/redis.ts
import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error(`redis client error: ${err.message}`);
});