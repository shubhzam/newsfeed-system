// apps/api/src/services/fanout.service.ts
import { prisma } from '../lib/prisma.js';
import { redisClient } from '../lib/redis.js';
import { kafka } from '../lib/kafka.js';

const FEED_LIST_CAP = 500;
const PROCESSED_GUARD_TTL_SECONDS = 300;

type PostCreatedEvent = {
  postId: string;
  authorId: string;
  createdAt: string;
};

export async function handlePostCreated(event: PostCreatedEvent) {
  const guardKey = `processed:post-created:${event.postId}`;
  const acquired = await redisClient.set(guardKey, '1', {
    NX: true,
    EX: PROCESSED_GUARD_TTL_SECONDS,
  });
  if (!acquired) {
    return;
  }

  const followers = await prisma.follow.findMany({
    where: { followeeId: event.authorId },
    select: { followerId: true },
  });

  const recipientIds = [...followers.map((f) => f.followerId), event.authorId];

  for (const recipientId of recipientIds) {
    const key = `feed:user:${recipientId}`;
    await redisClient.lPush(key, event.postId);
    await redisClient.lTrim(key, 0, FEED_LIST_CAP - 1);
  }
}

const fanoutConsumer = kafka.consumer({ groupId: 'fanout-worker' });

export async function startFanoutConsumer() {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({ topics: [{ topic: 'posts', numPartitions: 1 }] });
  await admin.disconnect();

  await fanoutConsumer.connect();
  await fanoutConsumer.subscribe({ topic: 'posts', fromBeginning: false });

  await fanoutConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString()) as PostCreatedEvent;
      await handlePostCreated(event);
    },
  });
}
