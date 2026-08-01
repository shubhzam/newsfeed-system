// apps/api/src/workers/outbox-poller.ts
// standalone process - run separately from the api (npx tsx src/workers/outbox-poller.ts).
// polls OutboxEvent for pending rows and publishes them to kafka. the api's write path
// never talks to kafka directly anymore - this is the only thing that does.
import 'dotenv/config';
import { prisma } from '../lib/prisma.js';
import { kafkaProducer } from '../lib/kafka.js';
import { OutboxConfig } from '../lib/config.js';

async function pollOnce() {
  const pendingEvents = await prisma.outboxEvent.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: OutboxConfig.BATCH_SIZE,
  });

  for (const event of pendingEvents) {
    try {
      await kafkaProducer.send({
        topic: 'posts',
        messages: [{ value: JSON.stringify(event.payload) }],
      });

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });
    } catch (err) {
      // per-row failure - one bad event doesn't stop the rest of the batch.
      // if the kafka send actually succeeded but this update failed before
      // committing, the row stays PENDING and gets republished next tick -
      // that's fine, the consumer's idempotency guard (feature 7) already
      // makes duplicate delivery a no-op downstream.
      const attempts = event.attempts + 1;
      const lastError = (err as Error).message;

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          attempts,
          lastError,
          status: attempts >= OutboxConfig.MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
        },
      });

      console.error(`outbox publish failed for event ${event.id} (attempt ${attempts}): ${lastError}`);
    }
  }
}

async function startPolling() {
  try {
    await pollOnce();
  } catch (err) {
    // a failure in the query itself (not a per-row send failure) - log and
    // keep the loop alive, don't let one bad tick kill the whole process
    console.error(`outbox poll tick failed: ${(err as Error).message}`);
  } finally {
    setTimeout(startPolling, OutboxConfig.POLL_INTERVAL_MS);
  }
}

async function main() {
  await kafkaProducer.connect();
  console.log(`outbox poller started, polling every ${OutboxConfig.POLL_INTERVAL_MS}ms`);
  startPolling();
}

main();