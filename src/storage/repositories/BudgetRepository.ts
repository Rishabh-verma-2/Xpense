import { Budget } from '../../shared/types/budget.types';
import { STORAGE_KEYS } from '../../shared/constants/appConstants';
import { storageGet, storageSet } from '../asyncStorageClient';
import { generateId } from '../../shared/utils/validators';

async function getAll(): Promise<Budget[]> {
  return (await storageGet<Budget[]>(STORAGE_KEYS.BUDGETS)) ?? [];
}

async function getByMonth(month: string): Promise<Budget[]> {
  const all = await getAll();
  return all.filter((b) => b.month === month);
}

async function upsert(
  data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<Budget> {
  const all = await getAll();
  const now = new Date().toISOString();

  if (data.id) {
    const idx = all.findIndex((b) => b.id === data.id);
    if (idx !== -1) {
      const updated: Budget = { ...all[idx], ...data, updatedAt: now };
      all[idx] = updated;
      await storageSet(STORAGE_KEYS.BUDGETS, all);
      return updated;
    }
  }

  // Check for existing budget in same month/category (replace it)
  const existingIdx = all.findIndex(
    (b) => b.month === data.month && b.categoryId === data.categoryId,
  );
  if (existingIdx !== -1) {
    const updated: Budget = { ...all[existingIdx], ...data, updatedAt: now };
    all[existingIdx] = updated;
    await storageSet(STORAGE_KEYS.BUDGETS, all);
    return updated;
  }

  const budget: Budget = {
    ...data,
    id: data.id ?? generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await storageSet(STORAGE_KEYS.BUDGETS, [...all, budget]);
  return budget;
}

async function remove(id: string): Promise<void> {
  const all = await getAll();
  await storageSet(
    STORAGE_KEYS.BUDGETS,
    all.filter((b) => b.id !== id),
  );
}

export const BudgetRepository = { getAll, getByMonth, upsert, remove };
