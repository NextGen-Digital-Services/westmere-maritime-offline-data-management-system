import { type RecordItem } from '../db/clientDb';
import { type ServerRecord } from '../db/serverMockDb';

export interface PushRecordPayload {
  record: RecordItem;
  idempotencyKey: string;
}

export interface PushRecordResponse {
  success: boolean;
  recordId: string;
  version: number;
  serverUpdatedAt: string;
  isDuplicate: boolean;
  conflictDetected?: boolean;
  serverRecord?: ServerRecord;
  error?: string;
}

export interface PullRecordsResponse {
  success: boolean;
  records: ServerRecord[];
  serverTime: string;
}

export interface UploadChunkPayload {
  attachmentId: string;
  recordId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  checksum: string;
  uploadedBy: string;
  vesselId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkBlob: Blob;
}

export interface ApiClientInterface {
  pushRecord(payload: PushRecordPayload): Promise<PushRecordResponse>;
  pullRecords(vesselId: string, since?: string): Promise<PullRecordsResponse>;
  uploadChunk(payload: UploadChunkPayload): Promise<boolean>;
  getVesselStatus(vesselId: string): Promise<{ isOnline: boolean; pendingShoreUpdates: number }>;
}
