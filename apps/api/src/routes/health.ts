// apps/api/src/routes/health.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { redisClient } from '../lib/redis.js';

export const healthRouter: Router = Router();

healthRouter.get('/health', async (req, res) => {
  const checks = { database: false, redis: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (err) {
    console.error(`health check: database unreachable - ${(err as Error).message}`);
  }

  try {
    await redisClient.ping();
    checks.redis = true;
  } catch (err) {
    console.error(`health check: redis unreachable - ${(err as Error).message}`);
  }

  const healthy = checks.database && checks.redis;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks,
  });
});