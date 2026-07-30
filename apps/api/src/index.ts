// apps/api/src/index.ts
import 'dotenv/config';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { redisClient } from './lib/redis.js';
import { kafkaProducer } from './lib/kafka.js';
import { startFanoutConsumer } from './services/fanout.service.js';
import { postsRouter } from './routes/posts.js';
import { healthRouter } from './routes/health.js';
import { usersRouter } from './routes/users.js';
import { authRouter } from './routes/auth.js';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(healthRouter);
app.use(postsRouter);
app.use(usersRouter);
app.use(authRouter);

app.get('/', (req, res) => {
  res.json({ status: 'api is running' });
});

app.use(errorHandler);

async function start() {
  await redisClient.connect();

  try {
    await kafkaProducer.connect();
    await startFanoutConsumer();
  } catch (err) {
    console.error(
      `kafka unavailable at startup - post creation will work but fan-out will not run until kafka is reachable and the server is restarted: ${(err as Error).message}`,
    );
  }

  app.listen(PORT, () => {
    console.log(`api listening on http://localhost:${PORT}`);
  });
}

start();