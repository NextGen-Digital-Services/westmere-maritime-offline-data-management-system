import { clientDb, type RecordItem } from '../db/clientDb';
import { serverMockDb, type ServerRecord } from '../db/serverMockDb';
import { v4 as uuidv4 } from 'uuid';

export interface ConflictDetails {
  recordId: string;
  localRecord: RecordItem;
  serverRecord: ServerRecord;
  conflictingFields: {
    key: string;
    label: string;
    localValue: any;
    serverValue: any;
  }[];
}

export function detectConflict(clientRecord: RecordItem, serverRecord: ServerRecord): boolean {
  if (clientRecord.id !== serverRecord.id) return false;
  // If server has a newer version or newer updatedAt while local also changed
  if (serverRecord.version > clientRecord.version) return true;
  if (clientRecord.serverUpdatedAt && serverRecord.serverUpdatedAt > clientRecord.serverUpdatedAt) {
    if (clientRecord.clientUpdatedAt > clientRecord.serverUpdatedAt) {
      return true;
    }
  }
  return false;
}

export function extractConflictingFields(local: RecordItem, server: ServerRecord) {
  const fields: { key: string; label: string; localValue: any; serverValue: any }[] = [];
  const allKeys = new Set([...Object.keys(local.data || {}), ...Object.keys(server.data || {})]);

  allKeys.forEach(key => {
    const localVal = local.data?.[key];
    const serverVal = server.data?.[key];
    if (JSON.stringify(localVal) !== JSON.stringify(serverVal)) {
      fields.push({
        key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        localValue: localVal,
        serverValue: serverVal
      });
    }
  });

  if ((local.rawText || '') !== (server.rawText || '')) {
    fields.push({
      key: 'rawText',
      label: 'Raw Text Narrative',
      localValue: local.rawText || '',
      serverValue: server.rawText || ''
    });
  }

  return fields;
}

export const conflictService = {
  async getConflict(recordId: string): Promise<ConflictDetails | null> {
    const local = await clientDb.records.get(recordId);
    const server = await serverMockDb.serverRecords.get(recordId);
    if (!local || !server) return null;

    return {
      recordId,
      localRecord: local,
      serverRecord: server,
      conflictingFields: extractConflictingFields(local, server)
    };
  },

  async resolveKeepLocal(recordId: string, userId: string, userName: string): Promise<void> {
    const local = await clientDb.records.get(recordId);
    const server = await serverMockDb.serverRecords.get(recordId);
    if (!local) return;

    const newVersion = (server?.version ?? local.version) + 1;
    const now = new Date().toISOString();

    const updated: RecordItem = {
      ...local,
      version: newVersion,
      status: 'Pending Sync',
      clientUpdatedAt: now
    };
    await clientDb.records.put(updated);

    // Enqueue push
    await clientDb.syncQueue.put({
      id: `queue-${uuidv4().substring(0, 8)}`,
      type: 'RECORD',
      entityId: recordId,
      action: 'UPDATE',
      idempotencyKey: uuidv4(),
      status: 'QUEUED',
      retryCount: 0,
      nextAttemptAt: Date.now(),
      createdAt: now
    });

    await clientDb.auditLogs.add({
      id: `audit-${uuidv4().substring(0, 8)}`,
      timestamp: now,
      userId,
      userName,
      vesselId: local.vesselId,
      action: 'RESOLVE_CONFLICT',
      targetEntity: 'RECORD',
      entityId: recordId,
      details: `Resolved conflict for "${local.title}" by keeping local vessel data (New Version ${newVersion}).`
    });
  },

  async resolveKeepServer(recordId: string, userId: string, userName: string): Promise<void> {
    const local = await clientDb.records.get(recordId);
    const server = await serverMockDb.serverRecords.get(recordId);
    if (!local || !server) return;

    const updated: RecordItem = {
      ...local,
      title: server.title,
      data: { ...server.data },
      version: server.version,
      status: 'Synced',
      isLocked: true,
      serverUpdatedAt: server.serverUpdatedAt,
      clientUpdatedAt: server.serverUpdatedAt
    };
    await clientDb.records.put(updated);
    // Remove from queue if it was pending
    await clientDb.syncQueue.where('entityId').equals(recordId).delete();

    await clientDb.auditLogs.add({
      id: `audit-${uuidv4().substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      vesselId: local.vesselId,
      action: 'RESOLVE_CONFLICT',
      targetEntity: 'RECORD',
      entityId: recordId,
      details: `Resolved conflict for "${local.title}" by adopting server shore data (Version ${server.version}).`
    });
  },

  async resolveMergeFields(
    recordId: string,
    mergedData: Record<string, any>,
    userId: string,
    userName: string
  ): Promise<void> {
    const local = await clientDb.records.get(recordId);
    const server = await serverMockDb.serverRecords.get(recordId);
    if (!local) return;

    const newVersion = (server?.version ?? local.version) + 1;
    const now = new Date().toISOString();

    const updated: RecordItem = {
      ...local,
      data: mergedData,
      version: newVersion,
      status: 'Pending Sync',
      clientUpdatedAt: now
    };
    await clientDb.records.put(updated);

    await clientDb.syncQueue.put({
      id: `queue-${uuidv4().substring(0, 8)}`,
      type: 'RECORD',
      entityId: recordId,
      action: 'UPDATE',
      idempotencyKey: uuidv4(),
      status: 'QUEUED',
      retryCount: 0,
      nextAttemptAt: Date.now(),
      createdAt: now
    });

    await clientDb.auditLogs.add({
      id: `audit-${uuidv4().substring(0, 8)}`,
      timestamp: now,
      userId,
      userName,
      vesselId: local.vesselId,
      action: 'RESOLVE_CONFLICT',
      targetEntity: 'RECORD',
      entityId: recordId,
      details: `Resolved conflict for "${local.title}" by merging local and server fields (New Version ${newVersion}).`
    });
  }
};
