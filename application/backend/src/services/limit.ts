import type { RequestHandler } from 'express';

/**
 * Per-IP fixed-window rate limit, kept in memory (no Redis needed for one instance).
 * Protects the Alchemy / Meta credits behind a public demo.
 */
export function rateLimit(name: string, perHour: number): RequestHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    if (perHour <= 0) return next();
    const now = Date.now();
    const ip = req.ip ?? 'unknown';
    let h = hits.get(ip);
    if (!h || now > h.reset) {
      h = { count: 0, reset: now + 60 * 60_000 };
      hits.set(ip, h);
    }
    h.count++;
    res.setHeader('X-RateLimit-Limit', perHour);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, perHour - h.count));
    if (h.count > perHour) {
      const mins = Math.ceil((h.reset - now) / 60_000);
      return res.status(429).json({ error: `Free demo limit reached (${perHour} ${name} per hour) - try again in ${mins} min` });
    }
    // forget old windows now and then so the map can't grow without bound
    if (hits.size > 10_000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    next();
  };
}
