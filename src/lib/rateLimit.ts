import { NextRequest, NextResponse } from 'next/server';

type Entry = {
  count: number;
  resetAt: number;
};

type Store = Map<string, Entry>;

const globalStore = globalThis as typeof globalThis & { __rateLimitStore?: Store };
const store: Store = globalStore.__rateLimitStore ?? new Map<string, Entry>();
if (!globalStore.__rateLimitStore) {
  globalStore.__rateLimitStore = store;
}

const getClientIp = (req: NextRequest) => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
};

export const enforceRateLimit = (
  req: NextRequest,
  options: { key: string; limit: number; windowMs: number }
) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucketKey = `${options.key}:${ip}`;
  const current = store.get(bucketKey);

  if (!current || current.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
      },
      { status: 429 }
    );
  }

  current.count += 1;
  store.set(bucketKey, current);
  return null;
};
