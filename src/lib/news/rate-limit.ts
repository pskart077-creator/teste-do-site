type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type NonceEntry = {
  expiresAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const nonceStore = new Map<string, NonceEntry>();

function now() {
  return Date.now();
}

function cleanupRateLimit() {
  const current = now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= current) {
      rateLimitStore.delete(key);
    }
  }
}

function cleanupNonces() {
  const current = now();
  for (const [key, value] of nonceStore.entries()) {
    if (value.expiresAt <= current) {
      nonceStore.delete(key);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  cleanupRateLimit();
  const current = now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= current) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: current + windowMs,
    });

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: current + windowMs,
    };
  }

  const nextCount = existing.count + 1;
  existing.count = nextCount;
  rateLimitStore.set(key, existing);

  return {
    allowed: nextCount <= limit,
    remaining: Math.max(0, limit - nextCount),
    resetAt: existing.resetAt,
  };
}

export function assertSingleUseNonce(
  sessionId: string,
  nonce: string,
  ttlMs = 5 * 60 * 1000,
) {
  cleanupNonces();
  const key = `${sessionId}:${nonce}`;
  const existing = nonceStore.get(key);

  if (existing && existing.expiresAt > now()) {
    return false;
  }

  nonceStore.set(key, {
    expiresAt: now() + ttlMs,
  });
  return true;
}
