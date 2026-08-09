export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string; // Ionicons name
  color: string; // hex e.g. #00695C
  isSystem: boolean; // true for 12 default categories — cannot be deleted
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
