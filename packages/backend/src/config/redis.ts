import Redis from 'ioredis';
import { env } from './env';

let redis: Redis;

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times: number): number | null {
      if (times > 3) {
        console.warn('Redis: max retries reached, running without Redis');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });

  redis.on('error', (err: Error) => {
    console.warn('Redis connection error (non-fatal):', err.message);
  });

  // Try to connect, but don't crash if it fails
  redis.connect().catch((err) => {
    console.warn('Redis initial connect failed (non-fatal):', err.message);
  });
} catch (err) {
  console.warn('Redis initialization failed, creating mock Redis');
  redis = new Redis({ lazyConnect: true });
}

export { redis };

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    console.log('Redis disconnected');
  } catch {
    // Redis wasn't connected
  }
}
