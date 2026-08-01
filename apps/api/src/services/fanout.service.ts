// apps/api/src/services/fanout.service.ts
import { prisma } from '../lib/prisma.js';
import { redisClient } from '../lib/redis.js';
import { kafka, kafkaProducer } from '../lib/kafka.js';
import { FeedConfig, DlqConfig } from '../lib/config.js';

const FEED_LIST_CAP = 500;
const PROCESSED_GUARD_TTL_SECONDS = 300;

type PostCreatedEvent = {
  postId: string;
  authorId: string;
  createdAt: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// small helper - some error types (seen from node-redis specifically) can have
// an empty .message even when meaningful, so fall back to the error's name
// rather than silently logging an empty string to the dlq
function describeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.constructor.name || 'unknown error';
  }
  return String(err);
}

async function sendToDlq(originalPayload: unknown, error: string, attempts: number) {
  try {
    await kafkaProducer.send({
      topic: 'posts-dlq',
      messages: [
        {
          value: JSON.stringify({
            originalTopic: 'posts',
            originalPayload,
            error,
            attempts,
            failedAt: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (dlqErr) {
    // no dlq-of-the-dlq - if this itself fails, log and move on
    console.error(`failed to publish to posts-dlq: ${describeError(dlqErr)}`);
  }
}

// the actual fan-out work, separated from the guard claim in handlePostCreated
// so retries can re-run just this part without re-claiming the guard - see
// planning doc, this split exists specifically to avoid a retry silently
// no-op'ing against its own prior guard claim
async function fanoutToRecipients(event: PostCreatedEvent) {
  const author = await prisma.user.findUnique({
    where: { id: event.authorId },
    select: { followerCount: true },
  });
  const isCelebrity = (author?.followerCount ?? 0) >= FeedConfig.CELEBRITY_THRESHOLD;

  const recipientIds = isCelebrity
    ? [event.authorId]
    : await prisma.follow
        .findMany({ where: { followeeId: event.authorId }, select: { followerId: true } })
        .then((followers) => [...followers.map((f) => f.followerId), event.authorId]);

  for (const recipientId of recipientIds) {
    const key = `feed:user:${recipientId}`;
    await redisClient.lPush(key, event.postId);
    await redisClient.lTrim(key, 0, FEED_LIST_CAP - 1);
  }
}

export async function handlePostCreated(event: PostCreatedEvent) {
  const guardKey = `processed:post-created:${event.postId}`;
  const acquired = await redisClient.set(guardKey, '1', {
    NX: true,
    EX: PROCESSED_GUARD_TTL_SECONDS,
  });
  if (!acquired) {
    return;
  }

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= DlqConfig.MAX_CONSUMER_RETRIES; attempt++) {
    try {
      await fanoutToRecipients(event);
      return;
    } catch (err) {
      lastError = describeError(err);
      console.error(
        `fanout attempt ${attempt}/${DlqConfig.MAX_CONSUMER_RETRIES} failed for postId ${event.postId}: ${lastError}`,
      );
      if (attempt < DlqConfig.MAX_CONSUMER_RETRIES) {
        await sleep(DlqConfig.RETRY_DELAY_MS);
      }
    }
  }

  // every retry exhausted - delete the guard so a future manual replay of this
  // message from the dlq isn't silently blocked by our own prior claim
  await redisClient.del(guardKey);
  await sendToDlq(event, lastError ?? 'unknown error', DlqConfig.MAX_CONSUMER_RETRIES);
}

const fanoutConsumer = kafka.consumer({ groupId: 'fanout-worker' });

export async function startFanoutConsumer() {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [
      { topic: 'posts', numPartitions: 1 },
      { topic: 'posts-dlq', numPartitions: 1 },
    ],
  });
  await admin.disconnect();

  await fanoutConsumer.connect();
  await fanoutConsumer.subscribe({ topic: 'posts', fromBeginning: false });

  await fanoutConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      let event: PostCreatedEvent;
      try {
        event = JSON.parse(message.value.toString()) as PostCreatedEvent;
      } catch (err) {
        // malformed payload - not transient, retrying won't help. straight to
        // dlq with the raw string, since there's no valid event to retry
        const msg = describeError(err);
        console.error(`failed to parse message, sending raw value to dlq: ${msg}`);
        await sendToDlq(message.value.toString(), `JSON parse failure: ${msg}`, 0);
        return;
      }

      try {
        await handlePostCreated(event);
      } catch (err) {
        // last-resort safety net - handlePostCreated already retries and dead-letters
        // fan-out failures internally, so reaching this means something more
        // fundamental broke (e.g. redis itself unreachable for the guard claim).
        // must not throw here either, or we're back to blocking the partition forever.
        const msg = describeError(err);
        console.error(`unexpected failure processing postId ${event.postId}, sending to dlq without retry: ${msg}`);
        await sendToDlq(event, msg, 0);
      }
    },
  });
}