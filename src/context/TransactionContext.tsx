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
import { getMonthKey } from '../shared/utils/dateUtils';
import { transactionsApi } from '../services/api';
import { useAuth } from './AuthContext';

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
          const remoteList: Transaction[] = res.data.map((t: any) => ({
            id: t.id || t._id,
            type: t.type,
            amount: t.amount,
            categoryId: typeof t.categoryId === 'object' ? (t.categoryId.id || t.categoryId._id) : t.categoryId,
            note: t.note,
            date: t.date,
            isRecurring: t.isRecurring,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          }));
          remoteList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  useEffect(() => {
    reload();
  }, [reload, token]);

  const addTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'deletedAt' | 'createdAt' | 'updatedAt'>) => {
      // Always save locally first for instant UI response
      const localTx = await TransactionRepository.create(data);
      dispatch({ type: 'ADD_TRANSACTION', payload: localTx });

      // Save to MongoDB Atlas via Backend API if authenticated
      if (token) {
        try {
          const res = await transactionsApi.create({
            categoryId: data.categoryId,
            type: data.type,
            amount: data.amount,
            note: data.notes,
            date: data.date,
          });
          if (res.success && res.data) {
            console.log('✅ Transaction saved to MongoDB Atlas:', res.data.id || res.data._id);
          }
        } catch (err) {
          console.warn('⚠️ Transaction queued locally (backend sync pending):', err);
        }
      }
      return localTx;
    },
    [token],
  );

  const updateTransaction = useCallback(
    async (id: string, changes: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      const updated = await TransactionRepository.update(id, changes);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: updated });

      if (token) {
        try {
          await transactionsApi.update(id, changes as any);
          console.log('✅ Transaction updated in MongoDB Atlas:', id);
        } catch (err) {
          console.warn('⚠️ Backend transaction update warning:', err);
        }
      }
      return updated;
    },
    [token],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await TransactionRepository.softDelete(id);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });

      if (token) {
        try {
          await transactionsApi.remove(id);
          console.log('✅ Transaction deleted from MongoDB Atlas:', id);
        } catch (err) {
          console.warn('⚠️ Backend transaction delete warning:', err);
        }
      }
    },
    [token],
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
