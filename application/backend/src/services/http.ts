// JSON fetch with timeout, retry on rate limits / 5xx, and a short in-memory cache
// (stands in for Redis until it's wired up).

const TTL = 10 * 60_000;
const cache = new Map<string, { at: number; data: unknown }>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class RetryableError extends Error {}

export async function fetchJson<T>(
  url: string,
  opts: { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number; retries?: number; cache?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, timeoutMs = 20_000, retries = 3 } = opts;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const key = `${method} ${url} ${payload ?? ''}`;
  const hit = cache.get(key);
  if (opts.cache !== false && hit && Date.now() - hit.at < TTL) return hit.data as T;

  // never put the full URL in errors - it can carry API keys
  const host = new URL(url).host;
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt) await sleep(600 * 2 ** (attempt - 1));
    try {
      const res = await fetch(url, {
        method,
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 429 || res.status >= 500) throw new RetryableError(`${host} responded ${res.status}`);
      if (!res.ok) throw new Error(`${host} responded ${res.status}`);
      const data = (await res.json()) as T;
      if (opts.cache !== false) cache.set(key, { at: Date.now(), data });
      return data;
    } catch (e: any) {
      last = e;
      const retryable = e instanceof RetryableError || e?.name === 'TimeoutError' || e?.name === 'TypeError';
      if (!retryable) throw e;
    }
  }
  const msg = (last as any)?.name === 'TimeoutError' ? `${host} timed out` : (last as Error)?.message ?? `${host} failed`;
  throw new Error(msg);
}

// Run at most `n` tasks at once - keeps free-tier APIs under their rate limits
export function limiter(n: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= n) await new Promise<void>((r) => queue.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}
