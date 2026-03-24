// In-memory leaky bucket rate limiter per API key
// Limits: 100 req/min on /api/pips, 30 req/min on /api/coach

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  keyId: string,
  namespace: string,
  maxTokens: number,
  refillPerSecond: number
): { allowed: boolean; remaining: number } {
  const bucketKey = `${namespace}:${keyId}`;
  const now = Date.now();

  let bucket = buckets.get(bucketKey);
  if (!bucket) {
    bucket = { tokens: maxTokens - 1, lastRefill: now };
    buckets.set(bucketKey, bucket);
    return { allowed: true, remaining: bucket.tokens };
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillPerSecond);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    return { allowed: false, remaining: 0 };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: Math.floor(bucket.tokens) };
}

// Convenience wrappers
export function checkPipRateLimit(keyId: string) {
  return checkRateLimit(keyId, "pips", 100, 100 / 60);
}

export function checkCoachRateLimit(keyId: string) {
  return checkRateLimit(keyId, "coach", 30, 30 / 60);
}
