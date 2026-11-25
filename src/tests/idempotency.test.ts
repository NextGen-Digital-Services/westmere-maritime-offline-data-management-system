import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { MockServer } from '../api/mockServer';
import { type RecordItem } from '../db/clientDb';

describe('Idempotency & Duplicate Prevention', () => {
  const server = new MockServer();

  const sampleRecord: RecordItem = {
    id: 'rec-idem-test-1',
    title: 'Daily Operations Log',
    formType: 'daily_ops',
    vesselId: 'vessel-1',
    createdBy: 'user-crew',
    authorName: 'John Reyes',
    status: 'Pending Sync',
    data: { voyageNumber: 'VOY-101', status: 'Underway' },
    version: 1,
    isDraft: false,
    isLocked: true,
    clientCreatedAt: new Date().toISOString(),
    clientUpdatedAt: new Date().toISOString()
  };

  it('acknowledges initial push successfully', async () => {
    const key = 'idem-token-unique-12345';
    const res1 = await server.pushRecord({ record: sampleRecord, idempotencyKey: key });

    expect(res1.success).toBe(true);
    expect(res1.isDuplicate).toBe(false);
    expect(res1.recordId).toBe(sampleRecord.id);
  });

  it('returns identical cached acknowledgement on repeated push without duplicating', async () => {
    const key = 'idem-token-retry-67890';
    const res1 = await server.pushRecord({ record: sampleRecord, idempotencyKey: key });
    expect(res1.success).toBe(true);
    expect(res1.isDuplicate).toBe(false);

    // Immediate retry with identical token (simulating satellite timeout retry)
    const res2 = await server.pushRecord({ record: sampleRecord, idempotencyKey: key });
    expect(res2.success).toBe(true);
    expect(res2.isDuplicate).toBe(true);
    expect(res2.recordId).toBe(res1.recordId);
    expect(res2.version).toBe(res1.version);
  });
});
