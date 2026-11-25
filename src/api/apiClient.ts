import { type ApiClientInterface, type PushRecordPayload, type PushRecordResponse, type PullRecordsResponse, type UploadChunkPayload } from './types';
import { mockServer } from './mockServer';

/**
 * Universal ApiClient implementation.
 * Wraps the mockServer in development / demo mode,
 * with seamless fallback or swap to real HTTP endpoints.
 */
class ApiClient implements ApiClientInterface {
  private useMock: boolean = true;
  private baseUrl: string = 'https://api.seasync.westmere.io/v1';

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public setUseMock(useMock: boolean) {
    this.useMock = useMock;
  }

  async pushRecord(payload: PushRecordPayload): Promise<PushRecordResponse> {
    if (this.useMock) {
      return await mockServer.pushRecord(payload);
    }
    // Future REST implementation
    const res = await fetch(`${this.baseUrl}/records/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': payload.idempotencyKey
      },
      body: JSON.stringify(payload.record)
    });
    return await res.json();
  }

  async pullRecords(vesselId: string, since?: string): Promise<PullRecordsResponse> {
    if (this.useMock) {
      return await mockServer.pullRecords(vesselId, since);
    }
    const params = new URLSearchParams({ vesselId });
    if (since) params.append('since', since);
    const res = await fetch(`${this.baseUrl}/records/sync/pull?${params.toString()}`);
    return await res.json();
  }

  async uploadChunk(payload: UploadChunkPayload): Promise<boolean> {
    if (this.useMock) {
      return await mockServer.uploadChunk(payload);
    }
    const formData = new FormData();
    formData.append('chunk', payload.chunkBlob);
    formData.append('attachmentId', payload.attachmentId);
    formData.append('chunkIndex', payload.chunkIndex.toString());
    formData.append('totalChunks', payload.totalChunks.toString());
    formData.append('checksum', payload.checksum);
    const res = await fetch(`${this.baseUrl}/files/upload/chunk`, {
      method: 'POST',
      body: formData
    });
    return res.ok;
  }

  async getVesselStatus(vesselId: string) {
    if (this.useMock) {
      return await mockServer.getVesselStatus(vesselId);
    }
    const res = await fetch(`${this.baseUrl}/vessels/${vesselId}/status`);
    return await res.json();
  }
}

export const apiClient = new ApiClient();
