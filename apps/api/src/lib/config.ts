// centralizes tunable constants so magic numbers aren't scattered across services
export class FeedConfig {
  // followerCount at or above this, an author's posts skip push fanout to followers
  static readonly CELEBRITY_THRESHOLD = 10_000;
  // posts pulled per celebrity followee at feed read time, matches page size
  static readonly CELEBRITY_PULL_LIMIT = 20;
}

export class OutboxConfig {
  static readonly POLL_INTERVAL_MS = 2000;
  static readonly BATCH_SIZE = 20;
  static readonly MAX_ATTEMPTS = 5;
}

export class DlqConfig {
  static readonly MAX_CONSUMER_RETRIES = 3;
  static readonly RETRY_DELAY_MS = 500;
}