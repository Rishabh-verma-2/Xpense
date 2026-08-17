import { Transaction } from '../../shared/types/transaction.types';
import { STORAGE_KEYS } from '../../shared/constants/appConstants';
import { storageGet, storageSet } from '../asyncStorageClient';
import { generateId } from '../../shared/utils/validators';
import { getMonthKey } from '../../shared/utils/dateUtils';

async function getAll(): Promise<Transaction[]> {
  const items = await storageGet<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
  return (items ?? []).filter((t) => !t.deletedAt);
}

async function getAllIncludingDeleted(): Promise<Transaction[]> {
  return (await storageGet<Transaction[]>(STORAGE_KEYS.TRANSACTIONS)) ?? [];
}

async function getByMonth(monthKey: string): Promise<Transaction[]> {
  const all = await getAll();
  return all.filter((t) => getMonthKey(t.date) === monthKey);
}

async function create(
  data: Omit<Transaction, 'id' | 'deletedAt' | 'createdAt' | 'updatedAt'>,
): Promise<Transaction> {
  const all = await getAllIncludingDeleted();
  const now = new Date().toISOString();
  const transaction: Transaction = {
    ...data,
    id: generateId(),
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await storageSet(STORAGE_KEYS.TRANSACTIONS, [...all, transaction]);
  return transaction;
}

async function update(
  id: string,
  changes: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
): Promise<Transaction> {
  const all = await getAllIncludingDeleted();
  const idx = all.findIndex((t) => t.id === id);
  const now = new Date().toISOString();

  if (idx === -1) {
    // If not found in local storage (e.g. came from remote MongoDB), upsert gracefully
    const newTx: Transaction = {
      id,
      amount: 0,
      type: 'expense',
      categoryId: '',
      categoryNameSnapshot: 'General',
      categoryIconSnapshot: 'pricetag-outline',
      categoryColorSnapshot: '#7C3AED',
      paymentMethod: 'cash',
      notes: '',
      date: now,
      isRecurring: false,
      deletedAt: null,
      createdAt: now,
      ...changes,
      updatedAt: now,
    };
    await storageSet(STORAGE_KEYS.TRANSACTIONS, [newTx, ...all]);
    return newTx;
  }

  const updated: Transaction = {
    ...all[idx],
    ...changes,
    updatedAt: now,
  };
  all[idx] = updated;
  await storageSet(STORAGE_KEYS.TRANSACTIONS, all);
  return updated;
}

async function bulkUpsert(transactions: Transaction[]): Promise<void> {
  if (!transactions || transactions.length === 0) return;
  const all = await getAllIncludingDeleted();
  const map = new Map<string, Transaction>();
  
  // Seed with existing
  for (const t of all) {
    map.set(t.id, t);
  }
  // Upsert incoming
  for (const t of transactions) {
    const existing = map.get(t.id);
    map.set(t.id, {
      ...(existing || {}),
      ...t,
      deletedAt: t.deletedAt !== undefined ? t.deletedAt : (existing?.deletedAt ?? null),
    });
  }

  await storageSet(STORAGE_KEYS.TRANSACTIONS, Array.from(map.values()));
}

async function softDelete(id: string): Promise<void> {
  await update(id, { deletedAt: new Date().toISOString() });
}

async function restore(id: string): Promise<void> {
  await update(id, { deletedAt: null });
}

async function clearAll(): Promise<void> {
  await storageSet(STORAGE_KEYS.TRANSACTIONS, []);
}

export const TransactionRepository = {
  getAll,
  getAllIncludingDeleted,
  getByMonth,
  create,
  update,
  bulkUpsert,
  softDelete,
  restore,
  clearAll,
};

