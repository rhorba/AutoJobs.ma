import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function make(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(requests, window),
  });
}

export const applyLimiter = make(5, "1 h");
export const cvLimiter    = make(3, "1 h");

export async function checkLimit(limiter: Ratelimit | null, key: string): Promise<boolean> {
  if (!limiter) return true;
  const { success } = await limiter.limit(key);
  return success;
}
