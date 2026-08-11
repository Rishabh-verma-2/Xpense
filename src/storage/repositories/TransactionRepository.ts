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
  if (idx === -1) throw new Error(`Transaction ${id} not found`);
  const updated: Transaction = {
    ...all[idx],
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await storageSet(STORAGE_KEYS.TRANSACTIONS, all);
  return updated;
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
  softDelete,
  restore,
  clearAll,
};
