import { clientDb } from '../db/clientDb';

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

async function deriveKey(passphrase: string, salt: BufferSource): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export const cryptoBackup = {
  async exportEncryptedBackup(passphrase: string): Promise<Blob> {
    const records = await clientDb.records.toArray();
    const attachments = await clientDb.attachments.toArray();
    const syncLogs = await clientDb.syncLogs.toArray();
    const settings = await clientDb.settings.toArray();
    const auditLogs = await clientDb.auditLogs.toArray();

    const backupPayload = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      system: 'SeaSync Maritime Offline System (Westmere)',
      data: {
        records,
        attachments,
        syncLogs,
        settings,
        auditLogs
      }
    });

    const enc = new TextEncoder();
    const plainBytes = enc.encode(backupPayload);

    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(passphrase, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plainBytes
    );

    // Header: Salt (16 bytes) + IV (12 bytes) + Ciphertext
    const combined = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.byteLength);
    combined.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);

    return new Blob([combined], { type: 'application/octet-stream' });
  },

  async restoreEncryptedBackup(
    file: File,
    passphrase: string
  ): Promise<{ restoredRecords: number; restoredAttachments: number }> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (bytes.length < SALT_BYTES + IV_BYTES + 16) {
      throw new Error('Invalid backup file: file format corrupt or truncated.');
    }

    const salt = bytes.slice(0, SALT_BYTES);
    const iv = bytes.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const ciphertext = bytes.slice(SALT_BYTES + IV_BYTES);

    let decrypted: ArrayBuffer;
    try {
      const key = await deriveKey(passphrase, salt);
      decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );
    } catch (err) {
      throw new Error('Decryption failed: Incorrect passphrase or damaged backup container.');
    }

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decrypted);
    const parsed = JSON.parse(jsonStr);

    if (!parsed?.data?.records) {
      throw new Error('Malformed backup payload structure.');
    }

    const { records = [], attachments = [], syncLogs = [], auditLogs = [] } = parsed.data;

    // Merge safely into local IndexedDB
    for (const rec of records) {
      await clientDb.records.put(rec);
    }
    for (const att of attachments) {
      await clientDb.attachments.put(att);
    }
    for (const log of syncLogs) {
      await clientDb.syncLogs.put(log);
    }
    for (const audit of auditLogs) {
      await clientDb.auditLogs.put(audit);
    }

    return {
      restoredRecords: records.length,
      restoredAttachments: attachments.length
    };
  }
};
