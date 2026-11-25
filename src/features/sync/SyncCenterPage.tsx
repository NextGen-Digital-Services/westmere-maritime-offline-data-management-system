import React, { useState, useEffect } from 'react';
import { clientDb, type SyncQueueItem, type SyncLog } from '../../db/clientDb';
import { useSyncStore } from '../../store/syncStore';
import { useConnectivity } from '../../hooks/useConnectivity';
import { Link } from 'react-router-dom';
import {
  RefreshCw, RotateCcw, AlertTriangle, CheckCircle2,
  Clock, ShieldCheck, ArrowRight, Layers
} from 'lucide-react';

export const SyncCenterPage: React.FC = () => {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const { engineStatus, triggerSync, triggerRetry } = useSyncStore();
  const { state: connState } = useConnectivity();

  const loadData = () => {
    clientDb.syncQueue.toArray().then(setQueueItems);
    clientDb.syncLogs.toCollection().reverse().sortBy('timestamp').then(setSyncLogs);
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 3000);
    return () => clearInterval(timer);
  }, []);

  const failedCount = queueItems.filter(q => q.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Header and Sync Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-navy dark:text-canvas">Sync Centre</h1>
          <p className="text-xs text-canvas-muted mt-0.5">Idempotent queue monitor, retry backoff, and sync execution history</p>
        </div>
        <div className="flex items-center space-x-2">
          {failedCount > 0 && (
            <button
              onClick={() => triggerRetry()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-sunshineYellow text-navy rounded text-xs font-bold hover:bg-sunshineYellow-dark"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry All Failed ({failedCount})</span>
            </button>
          )}
          <button
            onClick={() => triggerSync()}
            disabled={engineStatus.isSyncing || connState === 'Offline'}
            className="flex items-center space-x-1.5 px-3 py-2 bg-ocean hover:bg-ocean-hover text-white rounded text-xs font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${engineStatus.isSyncing ? 'animate-spin' : ''}`} />
            <span>{engineStatus.isSyncing ? 'Sync in Progress...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Sync Queue Table */}
      <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center space-x-2 font-bold text-sm text-navy dark:text-canvas">
            <Layers className="w-4 h-4 text-signalOrange" />
            <span>Active Sync Queue ({queueItems.length})</span>
          </div>
          <span className="text-xs text-seaGreen font-semibold flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Idempotency Keys Enforced</span>
          </span>
        </div>

        {queueItems.length === 0 ? (
          <div className="text-center py-6 text-xs text-canvas-muted">
            <CheckCircle2 className="w-8 h-8 text-seaGreen mx-auto mb-2" />
            All queued operations transmitted and acknowledged by central server.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-canvas-subtle font-bold text-canvas-muted uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Entity ID</th>
                  <th className="p-2.5">Idempotency Key</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Retries</th>
                  <th className="p-2.5">Next Attempt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-border">
                {queueItems.map(item => (
                  <tr key={item.id} className="hover:bg-canvas-subtle">
                    <td className="p-2.5 font-bold text-ocean">{item.type}</td>
                    <td className="p-2.5 font-mono">{item.entityId}</td>
                    <td className="p-2.5 font-mono text-[10px] text-canvas-muted">{item.idempotencyKey.slice(0, 16)}...</td>
                    <td className="p-2.5 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.status === 'FAILED' ? 'bg-coralRed-subtle text-coralRed' : 'bg-signalOrange-subtle text-signalOrange'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono">{item.retryCount} / 5</td>
                    <td className="p-2.5 text-canvas-muted font-mono">
                      {item.nextAttemptAt <= Date.now() ? 'Immediate' : `${Math.round((item.nextAttemptAt - Date.now()) / 1000)}s`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync Execution History Log */}
      <div className="bg-canvas-card border rounded-lg p-5 shadow-solid-sm space-y-4">
        <div className="flex items-center space-x-2 font-bold text-sm text-navy dark:text-canvas border-b pb-2">
          <Clock className="w-4 h-4 text-teal" />
          <span>Sync Run History Log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-canvas-subtle text-canvas-muted uppercase text-[10px] font-bold">
              <tr>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5">Pushed (Records)</th>
                <th className="p-2.5">Pushed (Attachments)</th>
                <th className="p-2.5">Pulled (Shore)</th>
                <th className="p-2.5">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-border">
              {syncLogs.slice(0, 10).map(log => (
                <tr key={log.id} className="hover:bg-canvas-subtle">
                  <td className="p-2.5 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-2.5 font-mono">{log.durationMs}ms</td>
                  <td className="p-2.5 font-bold text-ocean">{log.recordsPushed}</td>
                  <td className="p-2.5 font-bold text-violet">{log.attachmentsPushed}</td>
                  <td className="p-2.5 font-bold text-teal">{log.recordsPulled}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'SUCCESS' ? 'bg-seaGreen-subtle text-seaGreen' : 'bg-coralRed-subtle text-coralRed'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
