// PHASE 1: Session-based rate limiting for AI-cost-incurring endpoints.
//
// Design: in-memory sliding-window counter keyed by `${sessionId}:${bucket}`.
// This is per-Worker-isolate (not globally distributed across all edge
// locations), which is an intentional, pragmatic tradeoff for a lightweight
// Cloudflare Pages app -- it still meaningfully throttles a single abusive
// session/browser without needing a separate KV/D1 write on every single
// request (which would add latency + cost to every legitimate AI call).
// If stronger global guarantees are ever needed, swap the Map for a
// Cloudflare KV-backed counter using the same interface.

type Bucket = {
  count: number
  windowStartMs: number
}

const buckets = new Map<string, Bucket>()

// Periodically prevent unbounded memory growth in long-lived isolates.
let lastSweep = Date.now()
function sweepIfNeeded(windowMs: number) {
  const now = Date.now()
  if (now - lastSweep < 5 * 60 * 1000) return // sweep at most every 5 min
  lastSweep = now
  for (const [key, b] of buckets) {
    if (now - b.windowStartMs > windowMs) buckets.delete(key)
  }
}

export type RateLimitConfig = {
  /** Logical name of the limited resource, e.g. 'diagnosis', 'chat', 'library'. */
  bucket: string
  /** Max requests allowed per window. */
  limit: number
  /** Window size in milliseconds. */
  windowMs: number
}

// Configurable per-endpoint limits (Phase 1 requirement: "keep limits
// configurable"). Numbers chosen to comfortably support a real user working
// through the app while making sustained AI-cost abuse impractical.
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  diagnosis: { bucket: 'diagnosis', limit: 15, windowMs: 60 * 60 * 1000 }, // 15/hour
  chat: { bucket: 'chat', limit: 40, windowMs: 60 * 60 * 1000 }, // 40/hour
  library: { bucket: 'library', limit: 30, windowMs: 60 * 60 * 1000 } // 30/hour (AI-generated lookups only; cache hits aren't limited)
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  limit: number
  resetAtMs: number
}

/**
 * Single shared rate-limit check/consume function used by every AI route,
 * so limiting logic is defined once (Phase 1: "do not duplicate rate-limit
 * logic unnecessarily").
 */
export function checkRateLimit(sessionId: string, config: RateLimitConfig): RateLimitResult {
  sweepIfNeeded(config.windowMs)
  const key = `${sessionId}:${config.bucket}`
  const now = Date.now()
  let b = buckets.get(key)

  if (!b || now - b.windowStartMs >= config.windowMs) {
    b = { count: 0, windowStartMs: now }
    buckets.set(key, b)
  }

  const resetAtMs = b.windowStartMs + config.windowMs

  if (b.count >= config.limit) {
    return { allowed: false, remaining: 0, limit: config.limit, resetAtMs }
  }

  b.count += 1
  return { allowed: true, remaining: config.limit - b.count, limit: config.limit, resetAtMs }
}

/** Builds a friendly, actionable 429 JSON body + headers for a rate-limited request. */
export function rateLimitResponseBody(result: RateLimitResult, resourceLabel: string) {
  const secondsLeft = Math.max(1, Math.ceil((result.resetAtMs - Date.now()) / 1000))
  const minutesLeft = Math.ceil(secondsLeft / 60)
  return {
    error: `You've reached the ${resourceLabel} limit (${result.limit} per hour) for this session. Please try again in about ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
    rate_limited: true,
    limit: result.limit,
    reset_in_seconds: secondsLeft
  }
}
