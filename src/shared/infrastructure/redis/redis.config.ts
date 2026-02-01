import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  /**
   * Max 10 retries with exponential backoff (~30s total).
   * Prevents infinite retry loops on persistent failures.
   */
  retryStrategy: (times: number) => {
    if (times > 10) {
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  /**
   * lazyConnect prevents blocking the app startup if Redis is down.
   * Connection happens on first command instead.
   */
  lazyConnect: true,
  connectTimeout: 10000,
}));
