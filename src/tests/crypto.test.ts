import { describe, it, expect } from 'vitest';

describe('Web Crypto PBKDF2 + AES-GCM Architecture', () => {
  it('derives key and encrypts/decrypts with matching passphrase', async () => {
    const passphrase = 'VesselMasterSecretKey2026';
    const plaintext = JSON.stringify({ message: 'Confidential Noon Telemetry Data', rob: 450 });

    const enc = new TextEncoder();
    const dataBytes = enc.encode(plaintext);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBytes
    );

    expect(ciphertext.byteLength).toBeGreaterThan(0);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    expect(dec.decode(decrypted)).toBe(plaintext);
  });
});
