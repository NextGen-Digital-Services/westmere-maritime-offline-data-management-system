import { serverMockDb, type ServerRecord, type ServerAttachment, type IdempotencyEntry } from '../db/serverMockDb';
import { type PushRecordPayload, type PushRecordResponse, type PullRecordsResponse, type UploadChunkPayload } from './types';
import { detectConflict } from '../sync/conflict';

export interface MockServerControls {
  forceServerError: boolean;
  interruptNextUpload: boolean;
  simulateLatency: boolean;
  flakyFailureRatePercent: number; // 0 to 100
}

export const mockServerControls: MockServerControls = {
  forceServerError: false,
  interruptNextUpload: false,
  simulateLatency: true,
  flakyFailureRatePercent: 0
};

export class MockServer {
  private async applySimulation() {
    if (mockServerControls.forceServerError) {
      throw new Error('500 Internal Server Error (Simulated by Shore Server Demo Lab)');
    }

    if (mockServerControls.flakyFailureRatePercent > 0) {
      const roll = Math.random() * 100;
      if (roll < mockServerControls.flakyFailureRatePercent) {
        throw new Error('Satellite Packet Loss: Connection reset by peer during sync handshake.');
      }
    }

    if (mockServerControls.simulateLatency) {
      const delay = Math.floor(Math.random() * 200) + 100; // 100-300ms realistic satellite ping
      await new Promise(res => setTimeout(res, delay));
    }
  }

  public async pushRecord(payload: PushRecordPayload): Promise<PushRecordResponse> {
    await this.applySimulation();

    const { record, idempotencyKey } = payload;

    // 1. Check Idempotency Key (Guaranteed Zero Duplicates on Retry)
    const existingKey = await serverMockDb.idempotencyStore.get(idempotencyKey);
    if (existingKey) {
      const cached = JSON.parse(existingKey.responsePayload) as PushRecordResponse;
      return {
        ...cached,
        isDuplicate: true
      };
    }

    // 2. Conflict Detection Check
    const serverExisting = await serverMockDb.serverRecords.get(record.id);
    if (serverExisting && detectConflict(record, serverExisting)) {
      const conflictResponse: PushRecordResponse = {
        success: false,
        recordId: record.id,
        version: serverExisting.version,
        serverUpdatedAt: serverExisting.serverUpdatedAt,
        isDuplicate: false,
        conflictDetected: true,
        serverRecord: serverExisting,
        error: `Conflict: Server has newer version (${serverExisting.version}) modified at ${serverExisting.serverUpdatedAt}`
      };
      return conflictResponse;
    }

    // 3. Persist to Mock Server DB
    const now = new Date().toISOString();
    const newVersion = record.version || 1;

    const serverRecord: ServerRecord = {
      id: record.id,
      title: record.title,
      formType: record.formType,
      vesselId: record.vesselId,
      createdBy: record.createdBy,
      authorName: record.authorName,
      status: 'Synced',
      data: record.data,
      version: newVersion,
      serverCreatedAt: record.clientCreatedAt || now,
      serverUpdatedAt: now
    };

    await serverMockDb.serverRecords.put(serverRecord);

    const response: PushRecordResponse = {
      success: true,
      recordId: record.id,
      version: newVersion,
      serverUpdatedAt: now,
      isDuplicate: false
    };

    // Store in Idempotency table
    await serverMockDb.idempotencyStore.put({
      idempotencyKey,
      entityId: record.id,
      action: 'PUSH_RECORD',
      responsePayload: JSON.stringify(response),
      createdAt: now
    });

    return response;
  }

  public async pullRecords(vesselId: string, since?: string): Promise<PullRecordsResponse> {
    await this.applySimulation();

    let records = await serverMockDb.serverRecords
      .where('vesselId')
      .equals(vesselId)
      .toArray();

    if (since) {
      records = records.filter(r => r.serverUpdatedAt > since);
    }

    return {
      success: true,
      records,
      serverTime: new Date().toISOString()
    };
  }

  public async uploadChunk(payload: UploadChunkPayload): Promise<boolean> {
    await this.applySimulation();

    if (mockServerControls.interruptNextUpload) {
      mockServerControls.interruptNextUpload = false;
      throw new Error('Upload Interrupted: Uplink carrier lost during chunk transfer.');
    }

    let serverAtt = await serverMockDb.serverAttachments.get(payload.attachmentId);
    const now = new Date().toISOString();

    if (!serverAtt) {
      serverAtt = {
        id: payload.attachmentId,
        recordId: payload.recordId,
        fileName: payload.fileName,
        fileType: payload.fileType,
        fileSize: payload.fileSize,
        checksum: payload.checksum,
        uploadedBy: payload.uploadedBy,
        vesselId: payload.vesselId,
        totalChunks: payload.totalChunks,
        receivedChunks: [payload.chunkIndex],
        isComplete: payload.totalChunks <= 1,
        serverUpdatedAt: now
      };
    } else {
      if (!serverAtt.receivedChunks.includes(payload.chunkIndex)) {
        serverAtt.receivedChunks.push(payload.chunkIndex);
      }
      serverAtt.isComplete = serverAtt.receivedChunks.length >= payload.totalChunks;
      serverAtt.serverUpdatedAt = now;
    }

    await serverMockDb.serverAttachments.put(serverAtt);
    return true;
  }

  public async getVesselStatus(vesselId: string) {
    await this.applySimulation();
    const count = await serverMockDb.serverRecords.where('vesselId').equals(vesselId).count();
    return {
      isOnline: true,
      pendingShoreUpdates: count
    };
  }
}

export const mockServer = new MockServer();
