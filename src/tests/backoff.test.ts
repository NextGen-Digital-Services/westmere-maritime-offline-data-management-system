import { describe, it, expect } from 'vitest';
import { calculateBackoff } from '../sync/backoff';

describe('Exponential Backoff with Jitter', () => {
  it('returns 0 for attempt 0', () => {
    expect(calculateBackoff(0)).toBe(0);
  });

  it('calculates approximately 2000ms for attempt 1 with baseMs 2000', () => {
    const val = calculateBackoff(1, { baseMs: 2000, jitterFactor: 0.1 });
    // Jitter is +/- 10%
    expect(val).toBeGreaterThanOrEqual(1800);
    expect(val).toBeLessThanOrEqual(2200);
  });

  it('grows exponentially on consecutive attempts', () => {
    const attempt1 = calculateBackoff(1, { baseMs: 1000, jitterFactor: 0 });
    const attempt2 = calculateBackoff(2, { baseMs: 1000, jitterFactor: 0 });
    const attempt3 = calculateBackoff(3, { baseMs: 1000, jitterFactor: 0 });

    expect(attempt1).toBe(1000);
    expect(attempt2).toBe(2000);
    expect(attempt3).toBe(4000);
  });

  it('caps backoff at maxMs', () => {
    const max = 5000;
    const val = calculateBackoff(10, { baseMs: 1000, maxMs: max, jitterFactor: 0 });
    expect(val).toBe(max);
  });
});
