import { clientDb, type AttachmentMeta, type AttachmentBlobChunk } from '../clientDb';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 256 * 1024; // 256 KB

export const attachmentRepository = {
  async getAll(recordId?: string): Promise<AttachmentMeta[]> {
    if (recordId) {
      return await clientDb.attachments.where('recordId').equals(recordId).reverse().sortBy('createdAt');
    }
    return await clientDb.attachments.toCollection().reverse().sortBy('createdAt');
  },

  async getById(id: string): Promise<AttachmentMeta | undefined> {
    return await clientDb.attachments.get(id);
  },

  async saveFile(
    file: File,
    uploadedBy: string,
    vesselId: string,
    recordId?: string
  ): Promise<AttachmentMeta> {
    const id = `att-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    // 1. Calculate SHA-256 Checksum via Web Crypto
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Split into 256KB Chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1;
    const chunkPromises: Promise<any>[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end, file.type);

      const chunkRecord: AttachmentBlobChunk = {
        id: `${id}_chunk_${i}`,
        attachmentId: id,
        chunkIndex: i,
        totalChunks,
        chunkBlob
      };
      chunkPromises.push(clientDb.attachmentBlobs.put(chunkRecord));
    }
    await Promise.all(chunkPromises);

    const meta: AttachmentMeta = {
      id,
      recordId,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      checksum,
      uploadedBy,
      vesselId,
      status: 'Local',
      uploadedChunks: 0,
      totalChunks,
      uploadProgress: 0,
      createdAt: now,
      updatedAt: now
    };

    await clientDb.attachments.put(meta);

    // Enqueue attachment upload in sync queue
    await clientDb.syncQueue.put({
      id: `queue-${uuidv4().substring(0, 8)}`,
      type: 'ATTACHMENT',
      entityId: id,
      action: 'CREATE',
      idempotencyKey: uuidv4(),
      status: 'QUEUED',
      retryCount: 0,
      nextAttemptAt: Date.now(),
      createdAt: now
    });

    return meta;
  },

  async getFileBlob(id: string): Promise<Blob | null> {
    const meta = await clientDb.attachments.get(id);
    if (!meta) return null;

    const chunks = await clientDb.attachmentBlobs
      .where('attachmentId')
      .equals(id)
      .sortBy('chunkIndex');

    if (chunks.length === 0) return null;
    const blobParts = chunks.map(c => c.chunkBlob);
    return new Blob(blobParts, { type: meta.fileType });
  },

  async delete(id: string): Promise<void> {
    await clientDb.attachments.delete(id);
    await clientDb.attachmentBlobs.where('attachmentId').equals(id).delete();
    await clientDb.syncQueue.where('entityId').equals(id).delete();
  }
};
