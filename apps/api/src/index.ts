// apps/api/src/index.ts
import 'dotenv/config';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { redisClient } from './lib/redis.js';
import { postsRouter } from './routes/posts.js';
import { healthRouter } from './routes/health.js';
import { usersRouter } from './routes/users.js';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(healthRouter);
app.use(postsRouter);
app.use(usersRouter);
app.use(errorHandler);

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