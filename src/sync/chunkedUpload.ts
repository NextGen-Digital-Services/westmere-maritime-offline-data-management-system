import { clientDb, type AttachmentMeta } from '../db/clientDb';
import { apiClient } from '../api/apiClient';

export interface UploadProgressEvent {
  attachmentId: string;
  uploadedChunks: number;
  totalChunks: number;
  percentage: number;
  status: 'uploading' | 'completed' | 'paused' | 'failed';
  errorMessage?: string;
}

type UploadListener = (event: UploadProgressEvent) => void;

class ChunkedUploadService {
  private activeUploads: Map<string, { abortController: AbortController; isPaused: boolean }> = new Map();
  private listeners: Set<UploadListener> = new Set();

  public subscribe(listener: UploadListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public async uploadAttachment(attachmentId: string): Promise<boolean> {
    const meta = await clientDb.attachments.get(attachmentId);
    if (!meta) throw new Error('Attachment not found');

    const abortController = new AbortController();
    this.activeUploads.set(attachmentId, { abortController, isPaused: false });

    // Update status to Uploading
    await clientDb.attachments.update(attachmentId, { status: 'Uploading' });
    this.notify(attachmentId, meta.uploadedChunks, meta.totalChunks, 'uploading');

    try {
      const chunks = await clientDb.attachmentBlobs
        .where('attachmentId')
        .equals(attachmentId)
        .sortBy('chunkIndex');

      for (const chunk of chunks) {
        const state = this.activeUploads.get(attachmentId);
        if (!state || state.isPaused) {
          this.notify(attachmentId, meta.uploadedChunks, meta.totalChunks, 'paused');
          return false;
        }

        // Upload single chunk via ApiClient
        const success = await apiClient.uploadChunk({
          attachmentId,
          recordId: meta.recordId,
          fileName: meta.fileName,
          fileType: meta.fileType,
          fileSize: meta.fileSize,
          checksum: meta.checksum,
          uploadedBy: meta.uploadedBy,
          vesselId: meta.vesselId,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          chunkBlob: chunk.chunkBlob
        });

        if (!success) {
          throw new Error(`Failed uploading chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks}`);
        }

        const newUploaded = chunk.chunkIndex + 1;
        const progress = Math.round((newUploaded / chunk.totalChunks) * 100);

        await clientDb.attachments.update(attachmentId, {
          uploadedChunks: newUploaded,
          uploadProgress: progress,
          updatedAt: new Date().toISOString()
        });

        this.notify(attachmentId, newUploaded, chunk.totalChunks, 'uploading');
      }

      // Mark complete & Synced
      await clientDb.attachments.update(attachmentId, {
        status: 'Synced',
        uploadProgress: 100,
        updatedAt: new Date().toISOString()
      });

      this.activeUploads.delete(attachmentId);
      this.notify(attachmentId, meta.totalChunks, meta.totalChunks, 'completed');
      return true;
    } catch (err: any) {
      this.activeUploads.delete(attachmentId);
      await clientDb.attachments.update(attachmentId, { status: 'Failed' });
      this.notify(attachmentId, meta.uploadedChunks, meta.totalChunks, 'failed', err.message);
      return false;
    }
  }

  public pause(attachmentId: string) {
    const upload = this.activeUploads.get(attachmentId);
    if (upload) {
      upload.isPaused = true;
    }
  }

  public cancel(attachmentId: string) {
    const upload = this.activeUploads.get(attachmentId);
    if (upload) {
      upload.abortController.abort();
      this.activeUploads.delete(attachmentId);
    }
  }

  private notify(
    attachmentId: string,
    uploadedChunks: number,
    totalChunks: number,
    status: 'uploading' | 'completed' | 'paused' | 'failed',
    errorMessage?: string
  ) {
    const percentage = totalChunks > 0 ? Math.round((uploadedChunks / totalChunks) * 100) : 0;
    const event: UploadProgressEvent = {
      attachmentId,
      uploadedChunks,
      totalChunks,
      percentage,
      status,
      errorMessage
    };
    this.listeners.forEach(l => l(event));
  }
}

export const chunkedUploadService = new ChunkedUploadService();
