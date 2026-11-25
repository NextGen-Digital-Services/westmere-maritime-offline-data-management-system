import Dexie, { type EntityTable } from 'dexie';

export interface ServerRecord {
  id: string;
  title: string;
  formType: string;
  vesselId: string;
  createdBy: string;
  authorName: string;
  status: 'Synced';
  data: Record<string, any>;
  version: number;
  serverCreatedAt: string;
  serverUpdatedAt: string;
}

export interface ServerAttachment {
  id: string;
  recordId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  checksum: string;
  uploadedBy: string;
  vesselId: string;
  totalChunks: number;
  receivedChunks: number[];
  isComplete: boolean;
  serverUpdatedAt: string;
}

export interface IdempotencyEntry {
  idempotencyKey: string;
  entityId: string;
  action: string;
  responsePayload: string; // JSON
  createdAt: string;
}

export interface ServerSyncLogEntry {
  id: string;
  timestamp: string;
  vesselId: string;
  recordsCount: number;
  attachmentsCount: number;
  status: 'SUCCESS' | 'ERROR';
  details?: string;
}

class SeaSyncServerMockDatabase extends Dexie {
  serverRecords!: EntityTable<ServerRecord, 'id'>;
  serverAttachments!: EntityTable<ServerAttachment, 'id'>;
  idempotencyStore!: EntityTable<IdempotencyEntry, 'idempotencyKey'>;
  serverSyncHistory!: EntityTable<ServerSyncLogEntry, 'id'>;

  constructor() {
    super('seasync_server_mock');
    this.version(1).stores({
      serverRecords: 'id, formType, vesselId, version, serverUpdatedAt',
      serverAttachments: 'id, recordId, vesselId, checksum, serverUpdatedAt',
      idempotencyStore: 'idempotencyKey, entityId, createdAt',
      serverSyncHistory: 'id, timestamp, vesselId'
    });
  }
}

export const serverMockDb = new SeaSyncServerMockDatabase();
