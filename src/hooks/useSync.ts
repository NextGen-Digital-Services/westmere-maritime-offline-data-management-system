import { useState, useEffect } from 'react';
import { syncEngine, type SyncEngineStatus } from '../sync/engine';

export function useSync(): {
  status: SyncEngineStatus;
  syncNow: () => Promise<boolean>;
  retryFailed: () => Promise<number>;
} {
  const [status, setStatus] = useState<SyncEngineStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null
  });

  useEffect(() => {
    syncEngine.getStatus().then(setStatus);
    return syncEngine.subscribe(setStatus);
  }, []);

  return {
    status,
    syncNow: () => syncEngine.syncNow(),
    retryFailed: () => syncEngine.retryFailed()
  };
}
