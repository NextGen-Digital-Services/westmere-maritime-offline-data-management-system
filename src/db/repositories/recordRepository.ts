import { clientDb, type RecordItem, type EntryMode } from '../clientDb';
import { v4 as uuidv4 } from 'uuid';

export const recordRepository = {
  async getAll(vesselId?: string): Promise<RecordItem[]> {
    if (vesselId) {
      return await clientDb.records.where('vesselId').equals(vesselId).reverse().sortBy('clientUpdatedAt');
    }
    return await clientDb.records.toCollection().reverse().sortBy('clientUpdatedAt');
  },

  async getById(id: string): Promise<RecordItem | undefined> {
    return await clientDb.records.get(id);
  },

  async saveDraft(data: Partial<RecordItem> & { formType: string; vesselId: string; createdBy: string; authorName: string }): Promise<RecordItem> {
    const now = new Date().toISOString();
    let record: RecordItem;

    if (data.id) {
      const existing = await clientDb.records.get(data.id);
      if (existing) {
        record = {
          ...existing,
          title: data.title ?? existing.title,
          data: data.data !== undefined ? data.data : existing.data,
          rawText: data.rawText !== undefined ? data.rawText : existing.rawText,
          entryMode: data.entryMode || existing.entryMode || 'form',
          textUpdatedAt: data.rawText !== undefined ? now : existing.textUpdatedAt,
          clientUpdatedAt: now,
          isDraft: true
        };
        await clientDb.records.put(record);
        return record;
      }
    }

    record = {
      id: data.id || `rec-${uuidv4().substring(0, 8)}`,
      title: data.title || `Untitled ${data.formType.replace(/_/g, ' ')}`,
      formType: data.formType,
      vesselId: data.vesselId,
      createdBy: data.createdBy,
      authorName: data.authorName,
      status: 'Draft',
      data: data.data || {},
      rawText: data.rawText || null,
      entryMode: data.entryMode || 'form',
      textUpdatedAt: data.rawText ? now : undefined,
      version: 1,
      isDraft: true,
      isLocked: false,
      clientCreatedAt: now,
      clientUpdatedAt: now
    };

    await clientDb.records.put(record);
    return record;
  },

  async submitRecord(id: string): Promise<RecordItem> {
    const existing = await clientDb.records.get(id);
    if (!existing) throw new Error('Record not found');

    const now = new Date().toISOString();
    const updated: RecordItem = {
      ...existing,
      status: 'Pending Sync',
      isDraft: false,
      isLocked: true,
      clientUpdatedAt: now
    };

    await clientDb.records.put(updated);

    // Enqueue for synchronization with unique idempotency key
    const idempotencyKey = uuidv4();
    await clientDb.syncQueue.put({
      id: `queue-${uuidv4().substring(0, 8)}`,
      type: 'RECORD',
      entityId: id,
      action: existing.serverUpdatedAt ? 'UPDATE' : 'CREATE',
      idempotencyKey,
      status: 'QUEUED',
      retryCount: 0,
      nextAttemptAt: Date.now(),
      createdAt: now
    });

    // Write audit log
    await clientDb.auditLogs.add({
      id: `audit-${uuidv4().substring(0, 8)}`,
      timestamp: now,
      userId: existing.createdBy,
      userName: existing.authorName,
      vesselId: existing.vesselId,
      action: 'SUBMIT',
      targetEntity: 'RECORD',
      entityId: id,
      details: `Submitted record "${existing.title}" (${existing.entryMode?.toUpperCase()} mode, Version ${existing.version})`
    });

    return updated;
  },

  async reopenRecord(id: string): Promise<RecordItem> {
    const existing = await clientDb.records.get(id);
    if (!existing) throw new Error('Record not found');

    const updated: RecordItem = {
      ...existing,
      status: 'Draft',
      isDraft: true,
      isLocked: false,
      version: existing.version + 1,
      clientUpdatedAt: new Date().toISOString()
    };

    await clientDb.records.put(updated);
    return updated;
  },

  async delete(id: string, userId: string, userName: string): Promise<void> {
    const existing = await clientDb.records.get(id);
    if (existing) {
      await clientDb.records.delete(id);
      await clientDb.syncQueue.where('entityId').equals(id).delete();
      
      await clientDb.auditLogs.add({
        id: `audit-${uuidv4().substring(0, 8)}`,
        timestamp: new Date().toISOString(),
        userId,
        userName,
        vesselId: existing.vesselId,
        action: 'DELETE',
        targetEntity: 'RECORD',
        entityId: id,
        details: `Deleted record "${existing.title}"`
      });
    }
  }
};
