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
  restoreTransaction: (id: string) => Promise<void>;
  getByMonth: (monthKey: string) => Transaction[];
  reload: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    transactions: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const all = await TransactionRepository.getAll();
      // Sort by date descending
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      dispatch({ type: 'SET_TRANSACTIONS', payload: all });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: "Couldn't load transactions" });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'deletedAt' | 'createdAt' | 'updatedAt'>) => {
      const transaction = await TransactionRepository.create(data);
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      return transaction;
    },
    [],
  );

  const updateTransaction = useCallback(
    async (id: string, changes: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      const updated = await TransactionRepository.update(id, changes);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: updated });
      return updated;
    },
    [],
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await TransactionRepository.softDelete(id);
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, []);

  const restoreTransaction = useCallback(async (id: string) => {
    await TransactionRepository.restore(id);
    await reload();
  }, [reload]);

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
