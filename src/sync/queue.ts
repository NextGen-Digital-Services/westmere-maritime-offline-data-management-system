import { clientDb, type SyncQueueItem } from '../db/clientDb';
import { calculateBackoff } from './backoff';

export const MAX_RETRY_ATTEMPTS = 5;

export const queueManager = {
  async getPendingItems(limit = 10): Promise<SyncQueueItem[]> {
    const now = Date.now();
    // Retrieve items ready for attempt (nextAttemptAt <= now)
    const items = await clientDb.syncQueue
      .where('nextAttemptAt')
      .belowOrEqual(now)
      .limit(limit)
      .toArray();

    // Prioritize records first, then attachments
    return items.sort((a, b) => {
      if (a.type === b.type) return a.createdAt.localeCompare(b.createdAt);
      return a.type === 'RECORD' ? -1 : 1;
    });
  },

  async markInFlight(id: string): Promise<void> {
    await clientDb.syncQueue.update(id, { status: 'IN_FLIGHT' });
  },

  async markSuccess(id: string): Promise<void> {
    await clientDb.syncQueue.delete(id);
  },

  async markFailure(id: string, errorMessage: string): Promise<void> {
    const item = await clientDb.syncQueue.get(id);
    if (!item) return;

    const newRetryCount = item.retryCount + 1;
    if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
      await clientDb.syncQueue.update(id, {
        status: 'FAILED',
        retryCount: newRetryCount,
        lastError: errorMessage
      });
      // Also update entity status to Failed so UI shows clear retry button
      if (item.type === 'RECORD') {
        await clientDb.records.update(item.entityId, {
          status: 'Failed',
          lastSyncError: errorMessage
        });
      }
    } else {
      const delayMs = calculateBackoff(newRetryCount);
      await clientDb.syncQueue.update(id, {
        status: 'QUEUED',
        retryCount: newRetryCount,
        nextAttemptAt: Date.now() + delayMs,
        lastError: errorMessage
      });
    }
  },

  async retryAllFailed(): Promise<number> {
    const failedItems = await clientDb.syncQueue
      .where('status')
      .equals('FAILED')
      .toArray();

    const now = Date.now();
    for (const item of failedItems) {
      await clientDb.syncQueue.update(item.id, {
        status: 'QUEUED',
        retryCount: 0,
        nextAttemptAt: now
      });
      if (item.type === 'RECORD') {
        await clientDb.records.update(item.entityId, {
          status: 'Pending Sync',
          lastSyncError: undefined
        });
      }
    }
    return failedItems.length;
  }
};
