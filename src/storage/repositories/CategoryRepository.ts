import { Category } from '../../shared/types/category.types';
import { STORAGE_KEYS, DEFAULT_CATEGORIES } from '../../shared/constants/appConstants';
import { storageGet, storageSet } from '../asyncStorageClient';
import { generateId } from '../../shared/utils/validators';

async function getAll(): Promise<Category[]> {
  return (await storageGet<Category[]>(STORAGE_KEYS.CATEGORIES)) ?? [];
}

async function seed(): Promise<void> {
  const existing = await getAll();
  if (existing.length > 0) return; // already seeded
  const now = new Date().toISOString();
  const seeded: Category[] = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    createdAt: now,
    updatedAt: now,
  }));
  await storageSet(STORAGE_KEYS.CATEGORIES, seeded);
}

async function create(
  data: Omit<Category, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>,
): Promise<Category> {
  const all = await getAll();
  const now = new Date().toISOString();
  const category: Category = {
    ...data,
    id: generateId(),
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };
  await storageSet(STORAGE_KEYS.CATEGORIES, [...all, category]);
  return category;
}

async function update(
  id: string,
  changes: Partial<Omit<Category, 'id' | 'isSystem' | 'createdAt'>>,
): Promise<Category> {
  const all = await getAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Category ${id} not found`);
  const updated: Category = {
    ...all[idx],
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await storageSet(STORAGE_KEYS.CATEGORIES, all);
  return updated;
}

async function archive(id: string): Promise<void> {
  await update(id, { isArchived: true });
}

async function unarchive(id: string): Promise<void> {
  await update(id, { isArchived: false });
}

/**
 * Hard-delete only allowed for non-system categories.
 * Caller is responsible for reassigning transactions before calling this.
 */
async function remove(id: string): Promise<void> {
  const all = await getAll();
  const cat = all.find((c) => c.id === id);
  if (!cat) return;
  if (cat.isSystem) throw new Error('System categories cannot be deleted');
  await storageSet(
    STORAGE_KEYS.CATEGORIES,
    all.filter((c) => c.id !== id),
  );
}

export const CategoryRepository = {
  getAll,
  seed,
  create,
  update,
  archive,
  unarchive,
  remove,
};
