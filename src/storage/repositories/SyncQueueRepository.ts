import { Transaction } from '../../shared/types/transaction.types';
import { STORAGE_KEYS } from '../../shared/constants/appConstants';
import { storageGet, storageSet } from '../asyncStorageClient';

export interface PendingSyncItem {
  id: string; // Unique queue item identifier
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  transaction: Transaction;
  timestamp: number;
}

async function getQueue(): Promise<PendingSyncItem[]> {
  const items = await storageGet<PendingSyncItem[]>(STORAGE_KEYS.PENDING_SYNC_QUEUE);
  return items ?? [];
}

async function addToQueue(item: Omit<PendingSyncItem, 'id' | 'timestamp'>): Promise<PendingSyncItem> {
  const queue = await getQueue();
  const queueItem: PendingSyncItem = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  await storageSet(STORAGE_KEYS.PENDING_SYNC_QUEUE, [...queue, queueItem]);
  console.log(`📥 Added offline transaction to sync queue (${item.action}):`, item.transaction.id);
  return queueItem;
}

async function removeFromQueue(queueItemId: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((i) => i.id !== queueItemId);
  await storageSet(STORAGE_KEYS.PENDING_SYNC_QUEUE, filtered);
}

async function clearQueue(): Promise<void> {
  await storageSet(STORAGE_KEYS.PENDING_SYNC_QUEUE, []);
}

export const SyncQueueRepository = {
  getQueue,
  addToQueue,
  removeFromQueue,
  clearQueue,
};
