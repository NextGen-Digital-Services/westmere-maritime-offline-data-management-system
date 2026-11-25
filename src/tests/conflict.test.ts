import { describe, it, expect } from 'vitest';
import { detectConflict, extractConflictingFields } from '../sync/conflict';
import { type RecordItem } from '../db/clientDb';
import { type ServerRecord } from '../db/serverMockDb';

describe('Version & Timestamp Conflict Detection', () => {
  const baseLocalRecord: RecordItem = {
    id: 'rec-test-1',
    title: 'Noon Report',
    formType: 'noon_report',
    vesselId: 'vessel-1',
    createdBy: 'user-1',
    authorName: 'Officer',
    status: 'Synced',
    data: { course: 220, speedOverGround: 14.5 },
    version: 1,
    isDraft: false,
    isLocked: true,
    clientCreatedAt: '2026-11-20T10:00:00Z',
    clientUpdatedAt: '2026-11-20T10:00:00Z',
    serverUpdatedAt: '2026-11-20T10:05:00Z'
  };

  const baseServerRecord: ServerRecord = {
    id: 'rec-test-1',
    title: 'Noon Report',
    formType: 'noon_report',
    vesselId: 'vessel-1',
    createdBy: 'user-1',
    authorName: 'Officer',
    status: 'Synced',
    data: { course: 220, speedOverGround: 14.5 },
    version: 1,
    serverCreatedAt: '2026-11-20T10:00:00Z',
    serverUpdatedAt: '2026-11-20T10:05:00Z'
  };

  it('returns false when client and server versions match and timestamps are aligned', () => {
    expect(detectConflict(baseLocalRecord, baseServerRecord)).toBe(false);
  });

  it('detects conflict when server version is higher than client version', () => {
    const serverNewer = { ...baseServerRecord, version: 2 };
    expect(detectConflict(baseLocalRecord, serverNewer)).toBe(true);
  });

  it('detects conflict when both sides modified after last sync', () => {
    const localModified: RecordItem = {
      ...baseLocalRecord,
      clientUpdatedAt: '2026-11-20T12:00:00Z'
    };
    const serverModified: ServerRecord = {
      ...baseServerRecord,
      serverUpdatedAt: '2026-11-20T13:00:00Z'
    };
    expect(detectConflict(localModified, serverModified)).toBe(true);
  });

  it('extracts conflicting fields correctly', () => {
    const local = { ...baseLocalRecord, data: { course: 240, speed: 15 } };
    const server = { ...baseServerRecord, data: { course: 220, speed: 15 } };

    const diffs = extractConflictingFields(local, server);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].key).toBe('course');
    expect(diffs[0].localValue).toBe(240);
    expect(diffs[0].serverValue).toBe(220);
  });
});
