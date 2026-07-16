// apps/api/src/index.ts
import 'dotenv/config';
import express from 'express';
import { healthRouter } from './routes/health.js';
import { redisClient } from './lib/redis.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(healthRouter);

app.get('/', (req, res) => {
  res.json({ status: 'api is running' });
});

async function start() {
  await redisClient.connect();
  app.listen(PORT, () => {
    console.log(`api listening on http://localhost:${PORT}`);
  });
}

start();