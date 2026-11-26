import Dexie, { type EntityTable } from 'dexie';

export type UserRole = 'Crew' | 'Officer' | 'Master' | 'Shore Admin';
export type RecordStatus = 'Draft' | 'Pending Sync' | 'Syncing' | 'Synced' | 'Failed' | 'Conflict';
export type AttachmentStatus = 'Local' | 'Uploading' | 'Synced' | 'Failed';
export type EntryMode = 'form' | 'text' | 'hybrid';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  vesselId: string;
  avatarUrl?: string;
  lastLoginAt: string;
}

export interface Vessel {
  id: string;
  name: string;
  imoNumber: string;
  flag: string;
  type: string;
  callSign: string;
  dwt?: number;
  yearBuilt?: number;
  isActive: boolean;
}

export interface RecordItem {
  id: string;
  title: string;
  formType: string;
  vesselId: string;
  createdBy: string;
  authorName: string;
  status: RecordStatus;
  data: Record<string, any>;
  rawText?: string | null;
  entryMode?: EntryMode;
  textUpdatedAt?: string;
  version: number;
  isDraft: boolean;
  isLocked: boolean;
  clientCreatedAt: string;
  clientUpdatedAt: string;
  serverUpdatedAt?: string;
  lastSyncError?: string;
}

export interface AttachmentMeta {
  id: string;
  recordId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  checksum: string;
  uploadedBy: string;
  vesselId: string;
  status: AttachmentStatus;
  uploadedChunks: number;
  totalChunks: number;
  uploadProgress: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentBlobChunk {
  id: string;
  attachmentId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkBlob: Blob;
}

export interface SyncQueueItem {
  id: string;
  type: 'RECORD' | 'ATTACHMENT';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  idempotencyKey: string;
  status: 'QUEUED' | 'IN_FLIGHT' | 'FAILED';
  retryCount: number;
  nextAttemptAt: number;
  lastError?: string;
  createdAt: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  durationMs: number;
  recordsPushed: number;
  recordsPulled: number;
  attachmentsPushed: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorDetails?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DeviceInfo {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  isPersistent: boolean;
  registeredAt: string;
  lastSeenAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  vesselId: string;
  action: 'LOGIN' | 'CREATE' | 'UPDATE' | 'SUBMIT' | 'SYNC' | 'DELETE' | 'BACKUP' | 'RESTORE' | 'RESOLVE_CONFLICT' | 'SMART_FILL';
  targetEntity: string;
  entityId: string;
  details: string;
}

export interface AppSettings {
  id: string;
  serverUrl: string;
  syncIntervalSeconds: number;
  wifiOnly: boolean;
  storageAlertThresholdPercent: number;
  theme: 'light' | 'dark';
  language: string;
}

class SeaSyncClientDatabase extends Dexie {
  users!: EntityTable<User, 'id'>;
  vessels!: EntityTable<Vessel, 'id'>;
  records!: EntityTable<RecordItem, 'id'>;
  attachments!: EntityTable<AttachmentMeta, 'id'>;
  attachmentBlobs!: EntityTable<AttachmentBlobChunk, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  syncLogs!: EntityTable<SyncLog, 'id'>;
  notifications!: EntityTable<NotificationItem, 'id'>;
  deviceInfo!: EntityTable<DeviceInfo, 'id'>;
  auditLogs!: EntityTable<AuditLog, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('seasync_client');
    this.version(1).stores({
      users: 'id, email, role, vesselId',
      vessels: 'id, name, imoNumber, isActive',
      records: 'id, formType, status, vesselId, createdBy, clientUpdatedAt, serverUpdatedAt, version, isDraft',
      attachments: 'id, recordId, vesselId, status, checksum, createdAt',
      attachmentBlobs: 'id, attachmentId, chunkIndex',
      syncQueue: 'id, type, entityId, idempotencyKey, status, nextAttemptAt, createdAt',
      syncLogs: 'id, timestamp, status',
      notifications: 'id, type, isRead, createdAt',
      deviceInfo: 'id, registeredAt, lastSeenAt',
      auditLogs: 'id, timestamp, userId, vesselId, action',
      settings: 'id'
    });

    this.version(2).stores({
      records: 'id, formType, status, vesselId, createdBy, clientUpdatedAt, serverUpdatedAt, version, isDraft, entryMode'
    }).upgrade(tx => {
      return tx.table('records').toCollection().modify(rec => {
        if (!rec.entryMode) rec.entryMode = 'form';
        if (rec.rawText === undefined) rec.rawText = null;
      });
    });
  }
}

export const clientDb = new SeaSyncClientDatabase();
