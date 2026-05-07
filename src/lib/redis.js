import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error("UPSTASH_REDIS_REST_URL is missing in .env.local");
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("UPSTASH_REDIS_REST_TOKEN is missing in .env.local");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});