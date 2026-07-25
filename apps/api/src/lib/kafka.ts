// apps/api/src/lib/kafka.ts
import { Kafka } from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

export const kafka = new Kafka({
  clientId: 'newsfeed-api',
  brokers,
});

export const kafkaProducer = kafka.producer();
