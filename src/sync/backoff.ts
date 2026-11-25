export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  jitterFactor?: number;
}

/**
 * Calculates exponential backoff with jitter.
 * Standard sequence: ~2s, ~4s, ~8s, ~16s, ... up to 300s (5 minutes).
 */
export function calculateBackoff(
  attempt: number,
  options: BackoffOptions = {}
): number {
  const baseMs = options.baseMs ?? 2000;
  const maxMs = options.maxMs ?? 300000; // 5 minutes max
  const jitterFactor = options.jitterFactor ?? 0.25;

  if (attempt <= 0) return 0;

  // Exponential growth: base * 2^(attempt - 1)
  const exponential = baseMs * Math.pow(2, attempt - 1);
  const capped = Math.min(exponential, maxMs);

  // Apply jitter: +/- jitterFactor percentage
  const jitterRange = capped * jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange;

  return Math.max(baseMs, Math.round(capped + jitter));
}
