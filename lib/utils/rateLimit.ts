// lib/utils/rateLimit.ts

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

/**
 * インメモリの固定ウィンドウ方式レート制限。
 * サーバーレス環境ではインスタンスごとにカウンタが分離されるため厳密ではないが、
 * 素朴なクロール対策としては十分な簡易実装。
 */
export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
  now: number = Date.now()
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= opts.limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function __resetRateLimitForTests(): void {
  buckets.clear();
}
