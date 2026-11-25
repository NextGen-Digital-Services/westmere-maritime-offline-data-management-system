import { useState, useEffect } from 'react';

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  usedFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
  isPersistent: boolean;
  requestPersistence: () => Promise<boolean>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function useStorage(): StorageStats {
  const [usedBytes, setUsedBytes] = useState(2500000); // 2.5 MB fallback
  const [quotaBytes, setQuotaBytes] = useState(1000000000); // 1 GB fallback
  const [isPersistent, setIsPersistent] = useState(false);

  useEffect(() => {
    const updateStats = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage !== undefined) setUsedBytes(estimate.usage);
        if (estimate.quota !== undefined) setQuotaBytes(estimate.quota);
      }
      if (navigator.storage && navigator.storage.persisted) {
        const persisted = await navigator.storage.persisted();
        setIsPersistent(persisted);
      }
    };

    updateStats();
  }, []);

  const requestPersistence = async (): Promise<boolean> => {
    if (navigator.storage && navigator.storage.persist) {
      const persisted = await navigator.storage.persist();
      setIsPersistent(persisted);
      return persisted;
    }
    return false;
  };

  const percentUsed = quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;

  return {
    usedBytes,
    quotaBytes,
    usedFormatted: formatBytes(usedBytes),
    quotaFormatted: formatBytes(quotaBytes),
    percentUsed,
    isPersistent,
    requestPersistence
  };
}
