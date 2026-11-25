import { create } from 'zustand';
import { syncEngine, type SyncEngineStatus } from '../sync/engine';
import { connectivityMonitor, type ConnectivityStatus } from '../sync/connectivity';
import { mockServerControls } from '../api/mockServer';

export interface SyncLogEvent {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface SyncStoreState {
  engineStatus: SyncEngineStatus;
  connectivity: ConnectivityStatus;
  events: SyncLogEvent[];
  controls: {
    simulateOffline: boolean;
    networkQuality: 'fast' | 'slow' | 'flaky';
    forceServerError: boolean;
    interruptNextUpload: boolean;
  };
  triggerSync: () => Promise<boolean>;
  triggerRetry: () => Promise<number>;
  setSimulateOffline: (offline: boolean) => void;
  setNetworkQuality: (quality: 'fast' | 'slow' | 'flaky') => void;
  setForceServerError: (force: boolean) => void;
  setInterruptNextUpload: (interrupt: boolean) => void;
  addEvent: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  clearEvents: () => void;
}

export const useSyncStore = create<SyncStoreState>((set, get) => {
  // Subscribe to engine and connectivity
  syncEngine.subscribe(engineStatus => {
    set({ engineStatus });
  });

  connectivityMonitor.subscribe(connectivity => {
    set({ connectivity });
  });

  return {
    engineStatus: {
      isSyncing: false,
      pendingCount: 0,
      lastSyncTime: null,
      lastError: null
    },
    connectivity: connectivityMonitor.getStatus(),
    events: [
      {
        id: '1',
        timestamp: new Date().toLocaleTimeString(),
        message: 'SeaSync core offline engine initialized with Dexie IndexedDB backing.',
        type: 'info'
      }
    ],
    controls: {
      simulateOffline: false,
      networkQuality: 'fast',
      forceServerError: false,
      interruptNextUpload: false
    },

    triggerSync: async () => {
      get().addEvent('Manual sync initiated by user.', 'info');
      const ok = await syncEngine.syncNow();
      if (ok) {
        get().addEvent('Sync cycle completed successfully with verified server ack.', 'success');
      } else {
        get().addEvent('Sync cycle failed or was halted due to connection status.', 'error');
      }
      return ok;
    },

    triggerRetry: async () => {
      get().addEvent('Retrying all failed queue items.', 'warning');
      const count = await syncEngine.retryFailed();
      get().addEvent(`Re-queued ${count} failed item(s) for immediate delivery.`, 'info');
      return count;
    },

    setSimulateOffline: (offline: boolean) => {
      connectivityMonitor.setSimulatedOffline(offline);
      set(s => ({ controls: { ...s.controls, simulateOffline: offline } }));
      get().addEvent(offline ? 'Vessel offline simulation ENABLED.' : 'Vessel network restored.', offline ? 'warning' : 'success');
    },

    setNetworkQuality: (quality: 'fast' | 'slow' | 'flaky') => {
      connectivityMonitor.setNetworkQuality(quality);
      mockServerControls.flakyFailureRatePercent = quality === 'flaky' ? 40 : 0;
      set(s => ({ controls: { ...s.controls, networkQuality: quality } }));
      get().addEvent(`Network satellite condition set to "${quality.toUpperCase()}".`, 'info');
    },

    setForceServerError: (force: boolean) => {
      mockServerControls.forceServerError = force;
      set(s => ({ controls: { ...s.controls, forceServerError: force } }));
      get().addEvent(force ? 'Shore server 500 error injection ENABLED.' : 'Shore server error injection DISABLED.', force ? 'error' : 'info');
    },

    setInterruptNextUpload: (interrupt: boolean) => {
      mockServerControls.interruptNextUpload = interrupt;
      set(s => ({ controls: { ...s.controls, interruptNextUpload: interrupt } }));
      get().addEvent('Uplink interrupt armed for next chunk transfer.', 'warning');
    },

    addEvent: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      const newEvent: SyncLogEvent = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
      };
      set(s => ({ events: [newEvent, ...s.events].slice(0, 50) }));
    },

    clearEvents: () => set({ events: [] })
  };
});
