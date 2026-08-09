export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO datetime string
  categoryId: string;
  // Denormalized snapshots so history stays correct even if category changes
  categoryNameSnapshot: string;
  categoryIconSnapshot: string;
  categoryColorSnapshot: string;
  paymentMethod: PaymentMethod;
  notes: string;
  isRecurring: boolean; // Phase 2 flag — reserved in data model
  deletedAt: string | null; // soft delete
  createdAt: string;
  updatedAt: string;
}
