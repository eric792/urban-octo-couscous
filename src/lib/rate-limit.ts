import { headers } from "next/headers";
import { fetchWithTimeout, TIMEOUTS } from "@/lib/http";

/*
 * Rate limiting.
 *
 * - With UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set, counters live in
 *   Redis, so limits hold across every server / serverless instance.
 * - Without them, an in-memory counter protects each instance (fine for a
 *   single server and for development).
 * - If Redis is unreachable the limiter fails open (allows the request) and
 *   falls back to memory, so an outage never blocks checkout.
 */

export interface RateLimitPolicy {
  /** Requests allowed per window. */
  limit: number;
  windowMs: number;
}

/** Every limit in the store, in one place. */
export const RATE_LIMITS = {
  checkout: { limit: 10, windowMs: 60_000 },
  checkoutHourly: { limit: 40, windowMs: 60 * 60_000 },
  quote: { limit: 60, windowMs: 60_000 },
  pickupPoints: { limit: 30, windowMs: 60_000 },
  webhook: { limit: 300, windowMs: 60_000 },
  newsletter: { limit: 5, windowMs: 60_000 },
  trackOrder: { limit: 10, windowMs: 60_000 },
  // Admin sign-in: failed attempts only (successful sign-ins are refunded).
  login: { limit: 8, windowMs: 15 * 60_000 },
  loginPerEmail: { limit: 10, windowMs: 15 * 60_000 },
  adminExport: { limit: 20, windowMs: 60_000 },
} satisfies Record<string, RateLimitPolicy>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the window resets. */
  reset: number;
  retryAfterSeconds: number;
}

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryHit(key: string, policy: RateLimitPolicy, now: number): { count: number; resetAt: number } {
  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + policy.windowMs };
    memory.set(key, fresh);
    if (memory.size > 20_000) {
      for (const [k, b] of memory) if (b.resetAt <= now) memory.delete(k);
    }
    return fresh;
  }
  bucket.count += 1;
  return bucket;
}

async function redisHit(key: string, policy: RateLimitPolicy, now: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  // Fixed window: one key per window, expiring with it.
  const windowStart = Math.floor(now / policy.windowMs) * policy.windowMs;
  const redisKey = `za:rl:${key}:${windowStart}`;
  try {
    const res = await fetchWithTimeout("Redis", `${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, String(policy.windowMs), "NX"],
      ]),
      timeoutMs: TIMEOUTS.redis,
    });
    if (!res.ok) throw new Error(`Redis responded ${res.status}`);
    const data = (await res.json()) as { result?: number }[];
    const count = Number(data[0]?.result);
    if (!Number.isFinite(count)) throw new Error("Unexpected Redis response");
    return { count, resetAt: windowStart + policy.windowMs };
  } catch (err) {
    console.warn("[rate-limit] Redis unavailable, using in-memory fallback:", (err as Error).message);
    return null;
  }
}

/** Counts one request against `policy` for `identifier` (usually the client IP). */
export async function rateLimit(name: RateLimitName, identifier: string): Promise<RateLimitResult> {
  const policy = RATE_LIMITS[name];
  const now = Date.now();
  const key = `${name}:${identifier}`;
  const hit = (await redisHit(key, policy, now)) ?? memoryHit(key, policy, now);
  const remaining = Math.max(policy.limit - hit.count, 0);
  return {
    success: hit.count <= policy.limit,
    limit: policy.limit,
    remaining,
    reset: hit.resetAt,
    retryAfterSeconds: Math.max(Math.ceil((hit.resetAt - now) / 1000), 1),
  };
}

/**
 * Gives back one request counted by `rateLimit` — e.g. after a successful
 * sign-in, so only failed attempts use up the allowance. Counting first and
 * refunding later keeps the limit exact even under parallel requests.
 */
export async function refundRateLimit(name: RateLimitName, identifier: string, result: RateLimitResult): Promise<void> {
  const policy = RATE_LIMITS[name];
  const key = `${name}:${identifier}`;

  const bucket = memory.get(key);
  if (bucket && bucket.resetAt === result.reset && bucket.count > 0) bucket.count -= 1;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  const redisKey = `za:rl:${key}:${result.reset - policy.windowMs}`;
  try {
    // Only decrement a window that still exists, so a refund never creates a key.
    await fetchWithTimeout("Redis", `${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["EVAL", "if (tonumber(redis.call('GET', KEYS[1]) or '0') > 0) then return redis.call('DECR', KEYS[1]) end return 0", "1", redisKey],
      ]),
      timeoutMs: TIMEOUTS.redis,
    });
  } catch {
    // A missed refund only means one extra counted attempt — never worth failing a sign-in.
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
    ...(result.success ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}

/** Client IP from the proxy headers set by Vercel / most hosts. */
export function ipFromHeaders(h: Headers): string {
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function clientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

/** Friendly message for server actions. */
export function tooManyMessage(result: RateLimitResult): string {
  const wait = result.retryAfterSeconds;
  return `Too many attempts. Please wait ${wait >= 60 ? `${Math.ceil(wait / 60)} minute${wait >= 120 ? "s" : ""}` : `${wait} seconds`} and try again.`;
}
