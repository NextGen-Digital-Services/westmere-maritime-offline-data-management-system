import React from 'react';
import { X, Database, ShieldCheck, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';

export const HowItWorksModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-canvas-card border border-canvas-border rounded-lg max-w-2xl w-full shadow-solid-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-navy text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">How SeaSync Works</h2>
            <p className="text-xs text-teal mt-0.5">Maritime Offline-First Architecture & Zero Data Loss Guarantee</p>
          </div>
          <button onClick={onClose} className="text-canvas-muted hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-canvas leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 border rounded bg-canvas-subtle space-y-1.5">
              <div className="flex items-center space-x-2 text-ocean font-bold text-sm">
                <Database className="w-4 h-4" />
                <span>1. Local-First (IndexedDB)</span>
              </div>
              <p className="text-canvas-muted">
                All records, drafts, photos, and files are stored locally first in Dexie IndexedDB. The app functions completely without internet at mid-ocean.
              </p>
            </div>

            <div className="p-3.5 border rounded bg-canvas-subtle space-y-1.5">
              <div className="flex items-center space-x-2 text-seaGreen font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Idempotency Keys</span>
              </div>
              <p className="text-canvas-muted">
                Every push operation carries a unique UUIDv4 token. Even if satellite communication drops during transit and retries 5 times, zero duplicate records are created.
              </p>
            </div>

            <div className="p-3.5 border rounded bg-canvas-subtle space-y-1.5">
              <div className="flex items-center space-x-2 text-signalOrange font-bold text-sm">
                <Layers className="w-4 h-4" />
                <span>3. 256KB Resumable Chunks</span>
              </div>
              <p className="text-canvas-muted">
                Large PDFs and photos are split into 256KB chunks. Interrupted satellite uploads resume exactly from the last acknowledged byte.
              </p>
            </div>

            <div className="p-3.5 border rounded bg-canvas-subtle space-y-1.5">
              <div className="flex items-center space-x-2 text-violet font-bold text-sm">
                <RefreshCw className="w-4 h-4" />
                <span>4. 3-Way Conflict Engine</span>
              </div>
              <p className="text-canvas-muted">
                If shore superintendents edit a report while the vessel is offline, SeaSync detects version skew and enables field-by-field interactive merging.
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-bold text-sm mb-2 text-navy dark:text-canvas">The 12-Step Synchronization Flow</h4>
            <div className="space-y-1.5 font-mono text-[11px] bg-canvas-subtle p-3 rounded border">
              <div>[1] Record created locally → [2] UUID v4 assigned → [3] IndexedDB write confirmed</div>
              <div>[4] Status: Pending Sync → [5] Multi-source ping probe → [6] Uplink detected</div>
              <div>[7] JSON push with idempotency → [8] Attachments 256KB chunk stream</div>
              <div>[9] Shore server checksum validation → [10] Server ACK received</div>
              <div>[11] Local status updated to Synced → [12] Version history committed</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-seaGreen font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero data loss guaranteed by Westmere Maritime Technology.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-canvas-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-ocean hover:bg-ocean-hover text-white rounded font-bold"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
