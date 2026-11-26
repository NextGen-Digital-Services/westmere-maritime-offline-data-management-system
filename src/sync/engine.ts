import { clientDb, type SyncLog, type RecordItem } from '../db/clientDb';
import { queueManager } from './queue';
import { apiClient } from '../api/apiClient';
import { connectivityMonitor } from './connectivity';
import { chunkedUploadService } from './chunkedUpload';
import { v4 as uuidv4 } from 'uuid';

export interface SyncEngineStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

type SyncListener = (status: SyncEngineStatus) => void;

class SyncEngine {
  private isSyncing: boolean = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private autoSyncInterval: number | null = null;

  constructor() {
    // Listen for connectivity change -> auto sync when online restored
    connectivityMonitor.subscribe(status => {
      if (status.state === 'Online' && !this.isSyncing) {
        this.runSyncCycle('Auto (Internet Restored)');
      }
    });

    // Start auto sync periodic loop
    if (typeof window !== 'undefined') {
      this.autoSyncInterval = window.setInterval(() => {
        const conn = connectivityMonitor.getStatus();
        if (conn.state === 'Online' && !this.isSyncing) {
          this.runSyncCycle('Periodic Background');
        }
      }, 20000); // Check queue every 20 seconds
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  public async getStatus(): Promise<SyncEngineStatus> {
    const pendingCount = await clientDb.syncQueue.count();
    return {
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError
    };
  }

  public async syncNow(): Promise<boolean> {
    return await this.runSyncCycle('Manual User Request');
  }

  public async retryFailed(): Promise<number> {
    const count = await queueManager.retryAllFailed();
    if (count > 0) {
      await this.runSyncCycle('Retry Failed Items');
    }
    return count;
  }

  private async runSyncCycle(triggerReason: string): Promise<boolean> {
    const conn = connectivityMonitor.getStatus();
    if (conn.state === 'Offline') {
      return false;
    }

    if (this.isSyncing) return false;
    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    const startTime = performance.now();
    let recordsPushed = 0;
    let attachmentsPushed = 0;
    let recordsPulled = 0;
    let cycleFailed = false;

    try {
      // 1. Process Queue Items (Batch of 10)
      const items = await queueManager.getPendingItems(10);

      for (const item of items) {
        // Double check connectivity
        if (connectivityMonitor.getStatus().state === 'Offline') {
          break;
        }

        await queueManager.markInFlight(item.id);

        if (item.type === 'RECORD') {
          const record = await clientDb.records.get(item.entityId);
          if (!record) {
            await queueManager.markSuccess(item.id);
            continue;
          }

          // Update record status to Syncing in UI
          await clientDb.records.update(record.id, { status: 'Syncing' });

          try {
            const res = await apiClient.pushRecord({
              record,
              idempotencyKey: item.idempotencyKey
            });

            if (res.success) {
              // Rule: Mark Synced only AFTER verified server acknowledgement
              await clientDb.records.update(record.id, {
                status: 'Synced',
                version: res.version,
                serverUpdatedAt: res.serverUpdatedAt,
                lastSyncError: undefined
              });
              await queueManager.markSuccess(item.id);
              recordsPushed++;
            } else if (res.conflictDetected) {
              // Version conflict detected
              await clientDb.records.update(record.id, {
                status: 'Conflict',
                lastSyncError: res.error
              });
              await queueManager.markSuccess(item.id); // Remove from simple retry queue so user can resolve
              await clientDb.notifications.add({
                id: `notif-${uuidv4().substring(0, 8)}`,
                title: 'Data Conflict Detected',
                message: `Record "${record.title}" was modified on shore while you were offline.`,
                type: 'warning',
                isRead: false,
                link: '/conflicts',
                createdAt: new Date().toISOString()
              });
            } else {
              throw new Error(res.error || 'Server validation rejected the record.');
            }
          } catch (err: any) {
            await clientDb.records.update(record.id, { status: 'Pending Sync' });
            await queueManager.markFailure(item.id, err.message || 'Push failed');
            cycleFailed = true;
          }
        } else if (item.type === 'ATTACHMENT') {
          try {
            const success = await chunkedUploadService.uploadAttachment(item.entityId);
            if (success) {
              await queueManager.markSuccess(item.id);
              attachmentsPushed++;
            } else {
              throw new Error('Chunked upload paused or failed');
            }
          } catch (err: any) {
            await queueManager.markFailure(item.id, err.message || 'Upload failed');
            cycleFailed = true;
          }
        }
      }

      // 2. Pull server changes for current vessel
      try {
        const pullRes = await apiClient.pullRecords('vessel-1');
        if (pullRes.success) {
          for (const serverRec of pullRes.records) {
            const localRec = await clientDb.records.get(serverRec.id);
            if (!localRec) {
              // New record created on shore
              await clientDb.records.put({
                id: serverRec.id,
                title: serverRec.title,
                formType: serverRec.formType,
                vesselId: serverRec.vesselId,
                createdBy: serverRec.createdBy,
                authorName: serverRec.authorName || 'Bridge Officer',
                status: 'Synced',
                data: serverRec.data,
                rawText: serverRec.rawText || null,
                entryMode: serverRec.entryMode || 'form',
                textUpdatedAt: serverRec.textUpdatedAt || serverRec.serverUpdatedAt,
                version: serverRec.version,
                isDraft: false,
                isLocked: true,
                clientCreatedAt: serverRec.serverCreatedAt,
                clientUpdatedAt: serverRec.serverUpdatedAt,
                serverUpdatedAt: serverRec.serverUpdatedAt
              });
              recordsPulled++;
            }
          }
        }
      } catch (err) {
        // Pull failure does not block push sync status
      }

      this.lastSyncTime = new Date().toISOString();
      const durationMs = Math.round(performance.now() - startTime);

      // Record Sync History Log
      if (recordsPushed > 0 || attachmentsPushed > 0 || recordsPulled > 0 || cycleFailed) {
        const syncLog: SyncLog = {
          id: `synclog-${uuidv4().substring(0, 8)}`,
          timestamp: this.lastSyncTime,
          durationMs,
          recordsPushed,
          recordsPulled,
          attachmentsPushed,
          status: cycleFailed ? (recordsPushed > 0 ? 'PARTIAL' : 'FAILED') : 'SUCCESS',
          errorDetails: cycleFailed ? 'One or more items encountered errors during sync.' : undefined
        };
        await clientDb.syncLogs.add(syncLog);
      }

      return !cycleFailed;
    } catch (err: any) {
      this.lastError = err.message || 'Sync cycle aborted';
      return false;
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  private async notify() {
    const status = await this.getStatus();
    this.listeners.forEach(l => l(status));
  }
}

export const syncEngine = new SyncEngine();
