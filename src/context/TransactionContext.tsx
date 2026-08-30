import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { Transaction } from '../shared/types/transaction.types';
import { TransactionRepository } from '../storage/repositories/TransactionRepository';
import { SyncQueueRepository } from '../storage/repositories/SyncQueueRepository';
import { getMonthKey } from '../shared/utils/dateUtils';
import { transactionsApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useNotifications } from './NotificationContext';
import { BudgetRepository } from '../storage/repositories/BudgetRepository';

// ── State ────────────────────────────────────────────────────────────────────

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_ERROR'; payload: string };

function reducer(state: TransactionState, action: Action): TransactionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_TRANSACTIONS':
      return { transactions: action.payload, loading: false, error: null };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface TransactionContextValue {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  addTransaction: (
    data: Omit<Transaction, 'id' | 'deletedAt' | 'createdAt' | 'updatedAt'>,
  ) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    changes: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllTransactions: () => Promise<void>;
  restoreTransaction: (id: string) => Promise<void>;
  getByMonth: (monthKey: string) => Transaction[];
  reload: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { showSuccess } = useToast();
  const { checkBudgetAlerts } = useNotifications();
  const [state, dispatch] = useReducer(reducer, {
    transactions: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    dispatch({ type: 'SET_LOADING' });
    try {
      if (token) {
        // Try fetching live data from MongoDB Atlas backend
        const res = await transactionsApi.list({ limit: 100 });
        if (res.success && Array.isArray(res.data)) {
          const remoteList: Transaction[] = res.data.map((t: any) => {
            const cat = typeof t.categoryId === 'object' ? t.categoryId : null;
            const catId = cat ? (cat.id || cat._id) : (t.categoryId || 'cat_general');
            const catName = cat?.name || t.categoryNameSnapshot || t.categoryName || 'General';
            const catIcon = cat?.icon || t.categoryIconSnapshot || t.categoryIcon || 'pricetag-outline';
            const catColor = cat?.color || t.categoryColorSnapshot || t.categoryColor || '#7C3AED';

            return {
              id: t.id || t._id,
              type: t.type,
              amount: t.amount,
              categoryId: catId,
              categoryNameSnapshot: catName,
              categoryIconSnapshot: catIcon,
              categoryColorSnapshot: catColor,
              paymentMethod: t.paymentMethod || 'cash',
              notes: t.notes || t.note || '',
              date: t.date,
              isRecurring: t.isRecurring,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
            };
          });
          remoteList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          await TransactionRepository.bulkUpsert(remoteList);
          dispatch({ type: 'SET_TRANSACTIONS', payload: remoteList });
          return;
        }
      }
      // Local fallback
      const all = await TransactionRepository.getAll();
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      dispatch({ type: 'SET_TRANSACTIONS', payload: all });
    } catch {
      // Fallback on error
      const all = await TransactionRepository.getAll();
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      dispatch({ type: 'SET_TRANSACTIONS', payload: all });
    }
  }, [token]);

  // Automatic Background Offline Queue Sync Engine
  const syncOfflineQueue = useCallback(async () => {
    if (!token) return;
    try {
      const queue = await SyncQueueRepository.getQueue();
      if (queue.length === 0) return;

      console.log(`📡 Network connected! Syncing ${queue.length} pending offline transactions...`);
      let syncedCount = 0;

      for (const item of queue) {
        try {
          if (item.action === 'CREATE') {
            const res = await transactionsApi.create({
              categoryId: item.transaction.categoryId,
              type: item.transaction.type,
              amount: item.transaction.amount,
              paymentMethod: item.transaction.paymentMethod,
              note: item.transaction.notes,
              date: item.transaction.date,
              categoryName: item.transaction.categoryNameSnapshot,
              categoryIcon: item.transaction.categoryIconSnapshot,
              categoryColor: item.transaction.categoryColorSnapshot,
            });
            if (res.success && res.data) {
              syncedCount++;
              await SyncQueueRepository.removeFromQueue(item.id);
            }
          } else if (item.action === 'UPDATE') {
            await transactionsApi.update(item.transaction.id, item.transaction as any);
            syncedCount++;
            await SyncQueueRepository.removeFromQueue(item.id);
          } else if (item.action === 'DELETE') {
            await transactionsApi.remove(item.transaction.id);
            syncedCount++;
            await SyncQueueRepository.removeFromQueue(item.id);
          }
        } catch (e) {
          console.warn(`Sync item ${item.id} retry pending:`, e);
        }
      }

      if (syncedCount > 0) {
        showSuccess('Cloud Sync Complete ☁️', `Uploaded ${syncedCount} offline transaction(s) to database.`);
        await reload();
      }
    } catch (err) {
      console.warn('Sync offline queue warning:', err);
    }
  }, [token, reload, showSuccess]);

  useEffect(() => {
    reload();
    syncOfflineQueue();

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const handleOnline = () => {
        syncOfflineQueue();
      };
      window.addEventListener('online', handleOnline);
      return () => {
        if (typeof window.removeEventListener === 'function') {
          window.removeEventListener('online', handleOnline);
        }
      };
    }
  }, [reload, syncOfflineQueue, token]);

  const addTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'deletedAt' | 'createdAt' | 'updatedAt'>) => {
      // Always save locally first for instant UI response
      let localTx = await TransactionRepository.create(data);
      dispatch({ type: 'ADD_TRANSACTION', payload: localTx });

      // Save to MongoDB Atlas via Backend API if authenticated
      if (token) {
        try {
          const res = await transactionsApi.create({
            categoryId: data.categoryId,
            type: data.type,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            note: data.notes,
            date: data.date,
            categoryName: data.categoryNameSnapshot,
            categoryIcon: data.categoryIconSnapshot,
            categoryColor: data.categoryColorSnapshot,
          });
          if (res.success && res.data) {
            const remoteId = res.data.id || res.data._id;
            if (remoteId && remoteId !== localTx.id) {
              const oldId = localTx.id;
              localTx = { ...localTx, id: remoteId };
              // Replace local state with remote ID
              dispatch({ type: 'DELETE_TRANSACTION', payload: oldId });
              dispatch({ type: 'ADD_TRANSACTION', payload: localTx });
              await TransactionRepository.update(oldId, { ...localTx });
            }
            console.log('✅ Transaction saved to MongoDB Atlas:', remoteId);
          }
        } catch (err) {
          console.warn('⚠️ Offline mode: Transaction queued for auto-sync:', err);
          await SyncQueueRepository.addToQueue({ action: 'CREATE', transaction: localTx });
        }
      }

      // Check category budget thresholds asynchronously
      if (data.type === 'expense' && data.categoryId) {
        (async () => {
          try {
            const currentMonthKey = (data.date || new Date().toISOString()).slice(0, 7);
            const budgets = await BudgetRepository.getByMonth(currentMonthKey);
            const budget = budgets.find((b) => b.categoryId === data.categoryId);
            if (budget && budget.amount > 0) {
              const allTxs = await TransactionRepository.getAll();
              const prevSpend = allTxs
                .filter(
                  (t) =>
                    t.categoryId === data.categoryId &&
                    t.type === 'expense' &&
                    t.date.slice(0, 7) === currentMonthKey &&
                    t.id !== localTx.id
                )
                .reduce((sum, t) => sum + t.amount, 0);
              const newSpend = prevSpend + data.amount;
              await checkBudgetAlerts({
                categoryName: data.categoryNameSnapshot || 'Category',
                categoryId: data.categoryId,
                currentSpend: newSpend,
                previousSpend: prevSpend,
                budgetLimit: budget.amount,
              });
            }
          } catch (e) {
            console.warn('[TransactionContext] checkBudgetAlerts error:', e);
          }
        })();
      }

      return localTx;
    },
    [token, checkBudgetAlerts],
  );

  const updateTransaction = useCallback(
    async (id: string, changes: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      const updated = await TransactionRepository.update(id, changes);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: updated });

      if (token) {
        try {
          await transactionsApi.update(id, {
            ...changes,
            note: changes.notes !== undefined ? changes.notes : (changes as any).note,
            categoryName: changes.categoryNameSnapshot,
            categoryIcon: changes.categoryIconSnapshot,
            categoryColor: changes.categoryColorSnapshot,
          } as any);
          console.log('✅ Transaction updated in MongoDB Atlas:', id);
        } catch (err) {
          console.warn('⚠️ Offline mode: Transaction update queued for auto-sync:', err);
          await SyncQueueRepository.addToQueue({ action: 'UPDATE', transaction: updated });
        }
      }
      return updated;
    },
    [token],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const existing = state.transactions.find((t) => t.id === id);
      await TransactionRepository.softDelete(id);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });

      if (token && existing) {
        try {
          await transactionsApi.remove(id);
          console.log('✅ Transaction deleted from MongoDB Atlas:', id);
        } catch (err) {
          console.warn('⚠️ Offline mode: Transaction deletion queued for auto-sync:', err);
          await SyncQueueRepository.addToQueue({ action: 'DELETE', transaction: existing });
        }
      }
    },
    [token, state.transactions],
  );

  const deleteAllTransactions = useCallback(async () => {
    await TransactionRepository.clearAll();
    dispatch({ type: 'SET_TRANSACTIONS', payload: [] });

    if (token) {
      try {
        await transactionsApi.removeAll();
        console.log('✅ All transactions erased from MongoDB Atlas');
      } catch (err) {
        console.warn('⚠️ Backend transaction erase warning:', err);
      }
    }
  }, [token]);

  const restoreTransaction = useCallback(
    async (id: string) => {
      await TransactionRepository.restore(id);
      await reload();
    },
    [reload],
  );

  const getByMonth = useCallback(
    (monthKey: string) =>
      state.transactions.filter((t) => getMonthKey(t.date) === monthKey),
    [state.transactions],
  );

  return (
    <TransactionContext.Provider
      value={{
        ...state,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteAllTransactions,
        restoreTransaction,
        getByMonth,
        reload,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be inside TransactionProvider');
  return ctx;
}
