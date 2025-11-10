// src/lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 在开发环境中使用内存存储，生产环境中使用 Upstash Redis
const useMemoryStore = !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;

if (!useMemoryStore) {
  // 使用 Upstash Redis
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  ratelimit = new Ratelimit({
    redis: redis,
    // 每个IP每秒最多5个请求
    limiter: Ratelimit.slidingWindow(5, '1 s'),
    analytics: true,
  });
} else {
  // 开发环境中使用内存存储
  ratelimit = new Ratelimit({
    redis: Ratelimit.memoryStore(),
    // 每个IP每秒最多5个请求
    limiter: Ratelimit.slidingWindow(5, '1 s'),
    analytics: true,
  });
}

export const rateLimiter = ratelimit!;