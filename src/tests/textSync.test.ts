import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { clientDb, type RecordItem } from '../db/clientDb';
import { serverMockDb, type ServerRecord } from '../db/serverMockDb';
import { recordRepository } from '../db/repositories/recordRepository';
import { mockServer } from '../api/mockServer';
import { detectConflict, extractConflictingFields } from '../sync/conflict';

describe('Text Entry Mode Persistence and Sync Pipeline', () => {
  beforeEach(async () => {
    await clientDb.records.clear();
    await serverMockDb.serverRecords.clear();
  });

  it('saves and updates draft records preserving rawText and entryMode', async () => {
    const rawContent = 'Course: 270\nSpeed: 16.2\nRemarks: Navigating through Malacca Strait';
    const draft = await recordRepository.saveDraft({
      id: 'rec-text-01',
      formType: 'noon_report',
      title: 'Noon Report - Text Mode',
      data: { course: 270, speedOverGround: 16.2 },
      vesselId: 'vessel-01',
      createdBy: 'user-01',
      authorName: 'Second Officer',
      rawText: rawContent,
      entryMode: 'text'
    });

    expect(draft.entryMode).toBe('text');
    expect(draft.rawText).toBe(rawContent);
    expect(draft.textUpdatedAt).toBeDefined();

    const retrieved = await clientDb.records.get('rec-text-01');
    expect(retrieved?.entryMode).toBe('text');
    expect(retrieved?.rawText).toBe(rawContent);
  });

  it('pushes text mode record to server preserving rawText and returns updated server record', async () => {
    const rawContent = 'Report Date: 2026-11-26\nVoyage: VOY-998\nCourse: 045';
    const clientRecord: RecordItem = {
      id: 'rec-sync-01',
      title: 'Voyage 998 Noon Telemetry',
      formType: 'noon_report',
      vesselId: 'vessel-01',
      createdBy: 'user-01',
      authorName: 'First Officer',
      status: 'Pending Sync',
      data: { course: 45 },
      version: 1,
      isDraft: false,
      isLocked: true,
      rawText: rawContent,
      entryMode: 'text',
      textUpdatedAt: new Date().toISOString(),
      clientCreatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString()
    };

    const pushResult = await mockServer.pushRecord({
      record: clientRecord,
      idempotencyKey: 'idem-test-text-01'
    });
    expect(pushResult.success).toBe(true);

    const serverStored = await serverMockDb.serverRecords.get('rec-sync-01');
    expect(serverStored?.rawText).toBe(rawContent);
    expect(serverStored?.entryMode).toBe('text');
  });

  it('detects conflict when local and server text narratives diverge on new versions', () => {
    const localRecord: RecordItem = {
      id: 'rec-conflict-01',
      title: 'Bunker Sounding',
      formType: 'bunker_soundings',
      vesselId: 'vessel-01',
      createdBy: 'user-01',
      authorName: 'Chief Engineer',
      status: 'Synced',
      data: { robHfo: 450 },
      version: 1,
      isDraft: false,
      isLocked: false,
      rawText: 'ROB HFO: 450 MT\nTank 1: 200 MT\nTank 2: 250 MT',
      entryMode: 'text',
      clientCreatedAt: '2026-11-26T08:00:00Z',
      clientUpdatedAt: '2026-11-26T09:00:00Z',
      serverUpdatedAt: '2026-11-26T08:30:00Z'
    };

    const serverRecord: ServerRecord = {
      id: 'rec-conflict-01',
      title: 'Bunker Sounding',
      formType: 'bunker_soundings',
      vesselId: 'vessel-01',
      createdBy: 'user-01',
      authorName: 'Chief Engineer',
      status: 'Synced',
      data: { robHfo: 420 },
      version: 2,
      rawText: 'ROB HFO: 420 MT\nTank 1: 170 MT\nTank 2: 250 MT',
      entryMode: 'text',
      serverCreatedAt: '2026-11-26T08:00:00Z',
      serverUpdatedAt: '2026-11-26T09:15:00Z'
    };

    // Detect version conflict
    const hasConflict = detectConflict(localRecord, serverRecord);
    expect(hasConflict).toBe(true);

    // Extract conflicting fields
    const diffs = extractConflictingFields(localRecord, serverRecord);
    const textDiff = diffs.find(d => d.key === 'rawText');
    expect(textDiff).toBeDefined();
    expect(textDiff?.localValue).toContain('450 MT');
    expect(textDiff?.serverValue).toContain('420 MT');
  });
});
