import React, { useState } from 'react';
import { useStorage } from '../../hooks/useStorage';
import { cryptoBackup } from '../../lib/crypto';
import { useNotificationStore } from '../../store/notificationStore';
import { TextInput } from '../../components/ui/form/TextInput';
import { HardDrive, Download, Upload, ShieldCheck, Key } from 'lucide-react';

export const StorageManagerPage: React.FC = () => {
  const { usedFormatted, quotaFormatted, percentUsed, isPersistent, requestPersistence } = useStorage();
  const { showToast } = useNotificationStore();

  const [passphrase, setPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleExportBackup = async () => {
    if (!passphrase || passphrase.length < 6) {
      alert('Passphrase must be at least 6 characters for AES-GCM 256-bit encryption.');
      return;
    }
    setIsExporting(true);
    try {
      const blob = await cryptoBackup.exportEncryptedBackup(passphrase);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SeaSync_Encrypted_Backup_${new Date().toISOString().split('T')[0]}.seasync`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Encrypted Backup Created', 'AES-GCM encrypted database export downloaded.', 'success');
      setPassphrase('');
    } catch (err: any) {
      showToast('Export Failed', err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!restorePassphrase) {
      alert('Please enter the decryption passphrase before selecting the backup file.');
      return;
    }

    setIsRestoring(true);
    try {
      const result = await cryptoBackup.restoreEncryptedBackup(file, restorePassphrase);
      showToast(
        'Restore Complete',
        `Successfully restored ${result.restoredRecords} records and ${result.restoredAttachments} attachments.`,
        'success'
      );
      setRestorePassphrase('');
    } catch (err: any) {
      showToast('Restore Failed', err.message, 'error');
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  const getPassphraseStrength = (p: string) => {
    if (!p) return { label: 'Empty', color: 'text-muted' };
    if (p.length < 6) return { label: 'Too short (min 6)', color: 'text-coralRed' };
    if (p.length < 10) return { label: 'Good (AES-256)', color: 'text-sunshineYellow-dark' };
    return { label: 'Strong (PBKDF2 100k)', color: 'text-seaGreen' };
  };

  const strength = getPassphraseStrength(passphrase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-heading text-primary">Storage & Encrypted Backup</h1>
        <p className="text-xs text-secondary mt-0.5">IndexedDB allocation telemetry and Web Crypto AES-GCM disaster recovery</p>
      </div>

      {/* Storage Gauge Card */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-solid-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center space-x-2 font-bold text-sm text-primary">
            <HardDrive className="w-4 h-4 text-violet" />
            <span>Local IndexedDB Allocation</span>
          </div>
          <span className="text-xs font-mono font-bold text-ocean">
            {usedFormatted} used of {quotaFormatted} ({percentUsed}%)
          </span>
        </div>

        <div className="w-full bg-surface-alt h-3 rounded-full overflow-hidden border border-border">
          <div
            className={`h-full transition-all ${percentUsed > 80 ? 'bg-coralRed' : 'bg-seaGreen'}`}
            style={{ width: `${Math.max(2, percentUsed)}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-secondary gap-2 pt-2">
          <div>
            Persistence Mode:{' '}
            <span className={`font-bold ${isPersistent ? 'text-seaGreen' : 'text-signalOrange'}`}>
              {isPersistent ? 'PERMANENT (Eviction Protected)' : 'BEST EFFORT'}
            </span>
          </div>
          {!isPersistent && (
            <button
              onClick={() => requestPersistence()}
              className="px-3.5 py-1.5 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid transition-colors"
            >
              Request Persistent Storage
            </button>
          )}
        </div>
      </div>

      {/* Web Crypto Encrypted Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export Backup Card */}
        <div className="bg-surface border border-border rounded-lg p-5 shadow-solid-sm space-y-4">
          <div className="flex items-center space-x-2 font-bold text-sm text-primary">
            <Download className="w-4 h-4 text-seaGreen" />
            <span>Create Encrypted Container (.seasync)</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Exports all client reports, attachments metadata, settings, and audit logs into a single AES-GCM 256-bit encrypted binary package with PBKDF2 100k rounds.
          </p>

          <div className="space-y-3">
            <TextInput
              label="Set Container Passphrase"
              type="password"
              placeholder="Min 6 characters..."
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              accent="green"
              helperText={`Encryption Strength: ${strength.label}`}
            />
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full py-2.5 bg-seaGreen hover:bg-seaGreen-dark text-white rounded text-xs font-bold shadow-solid transition-colors disabled:opacity-50"
            >
              {isExporting ? 'Encrypting & Packaging...' : 'Download Encrypted Container'}
            </button>
          </div>
        </div>

        {/* Restore Backup Card */}
        <div className="bg-surface border border-border rounded-lg p-5 shadow-solid-sm space-y-4">
          <div className="flex items-center space-x-2 font-bold text-sm text-primary">
            <Upload className="w-4 h-4 text-ocean" />
            <span>Restore Encrypted Container</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Decrypts and safely merges saved vessel logs, deduplicating records by UUID to guarantee zero data overwriting.
          </p>

          <div className="space-y-3">
            <TextInput
              label="Enter Container Passphrase"
              type="password"
              placeholder="Passphrase used during export..."
              value={restorePassphrase}
              onChange={e => setRestorePassphrase(e.target.value)}
              accent="ocean"
            />
            <label className="w-full py-2.5 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold shadow-solid transition-colors text-center block cursor-pointer">
              <span>{isRestoring ? 'Decrypting & Merging...' : 'Select .seasync File & Restore'}</span>
              <input
                type="file"
                accept=".seasync,application/octet-stream"
                onChange={handleRestoreFile}
                className="hidden"
                disabled={isRestoring}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
