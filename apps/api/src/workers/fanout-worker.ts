// apps/api/src/workers/fanout-worker.ts
// standalone process - run separately from the api (npx tsx src/workers/fanout-worker.ts).
// consumes post.created events and fans them out to followers' redis feed lists.
// extracted from index.ts so kafka consumption isn't bundled into the api's
// process lifecycle - matches the outbox-poller precedent.
import 'dotenv/config';
import { redisClient } from '../lib/redis.js';
import { kafkaProducer } from '../lib/kafka.js';
import { startFanoutConsumer } from '../services/fanout.service.js';

async function main() {
  // redis must connect before the consumer starts - fanout.service.ts uses
  // redisClient directly (guard claim, feed list writes) without connecting
  // it itself, same implicit-dependency shape as post.service.ts always had
  // on index.ts connecting it first.
  await redisClient.connect();
  await kafkaProducer.connect();
  await startFanoutConsumer();
  console.log('fanout worker started');
}

main();