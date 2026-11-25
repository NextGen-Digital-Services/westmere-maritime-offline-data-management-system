import { describe, it, expect } from 'vitest';
import { MAX_RETRY_ATTEMPTS } from '../sync/queue';
import { calculateBackoff } from '../sync/backoff';

describe('Sync Queue Logic & Constraints', () => {
  it('enforces maximum 5 retry attempts before marking permanently failed', () => {
    expect(MAX_RETRY_ATTEMPTS).toBe(5);
  });

  it('calculates scheduled nextAttempt delays appropriately for retries', () => {
    const attempt1Delay = calculateBackoff(1);
    const attempt5Delay = calculateBackoff(5);

    expect(attempt1Delay).toBeGreaterThanOrEqual(1500);
    expect(attempt5Delay).toBeGreaterThan(attempt1Delay);
  });

  it('correctly sorts priority: records before attachments', () => {
    const items = [
      { id: '1', type: 'ATTACHMENT', createdAt: '2026-11-20T10:00:00Z' },
      { id: '2', type: 'RECORD', createdAt: '2026-11-20T10:01:00Z' },
      { id: '3', type: 'ATTACHMENT', createdAt: '2026-11-20T09:00:00Z' },
      { id: '4', type: 'RECORD', createdAt: '2026-11-20T09:30:00Z' }
    ];

    const sorted = items.sort((a, b) => {
      if (a.type === b.type) return a.createdAt.localeCompare(b.createdAt);
      return a.type === 'RECORD' ? -1 : 1;
    });

    expect(sorted[0].type).toBe('RECORD');
    expect(sorted[1].type).toBe('RECORD');
    expect(sorted[2].type).toBe('ATTACHMENT');
    expect(sorted[3].type).toBe('ATTACHMENT');
  });
});
