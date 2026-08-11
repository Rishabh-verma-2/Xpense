import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { Budget } from '../shared/types/budget.types';
import { BudgetRepository } from '../storage/repositories/BudgetRepository';
import { budgetsApi } from '../services/api';
import { useAuth } from './AuthContext';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
}

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'UPSERT_BUDGET'; payload: Budget }
  | { type: 'REMOVE_BUDGET'; payload: string };

function reducer(state: BudgetState, action: Action): BudgetState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true };
    case 'SET_BUDGETS':
      return { budgets: action.payload, loading: false };
    case 'UPSERT_BUDGET': {
      const exists = state.budgets.some((b) => b.id === action.payload.id);
      return {
        ...state,
        budgets: exists
          ? state.budgets.map((b) => (b.id === action.payload.id ? action.payload : b))
          : [...state.budgets, action.payload],
      };
    }
    case 'REMOVE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== action.payload),
      };
    default:
      return state;
  }
}

interface BudgetContextValue {
  budgets: Budget[];
  loading: boolean;
  getByMonth: (month: string) => Budget[];
  upsertBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [state, dispatch] = useReducer(reducer, { budgets: [], loading: true });

  const reload = useCallback(async () => {
    dispatch({ type: 'SET_LOADING' });
    try {
      if (token) {
        try {
          const res = await budgetsApi.list();
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const remoteBudgets: Budget[] = res.data.map((b: any) => ({
              id: b.id || b._id,
              categoryId: typeof b.categoryId === 'object' ? (b.categoryId.id || b.categoryId._id) : b.categoryId,
              amount: b.limit,
              period: b.period || 'monthly',
              month: `${b.year}-${String(b.month).padStart(2, '0')}`,
              createdAt: b.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
            dispatch({ type: 'SET_BUDGETS', payload: remoteBudgets });
            return;
          }
        } catch (e) {
          console.warn('⚠️ Budget API fetch warning:', e);
        }
      }
      const all = await BudgetRepository.getAll();
      dispatch({ type: 'SET_BUDGETS', payload: all });
    } catch {
      const all = await BudgetRepository.getAll();
      dispatch({ type: 'SET_BUDGETS', payload: all });
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload, token]);

  const getByMonth = useCallback(
    (month: string) => state.budgets.filter((b) => b.month === month),
    [state.budgets],
  );

  const upsertBudget = useCallback(
    async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const budget = await BudgetRepository.upsert(data);
      dispatch({ type: 'UPSERT_BUDGET', payload: budget });

      if (token) {
        try {
          const [yearStr, monthStr] = data.month.split('-');
          await budgetsApi.upsert({
            categoryId: data.categoryId ?? '',
            limit: data.amount,
            period: 'monthly',
            month: parseInt(monthStr, 10),
            year: parseInt(yearStr, 10),
          });
          console.log('✅ Budget saved to MongoDB Atlas');
        } catch (e) {
          console.warn('⚠️ Budget backend save warning:', e);
        }
      }
      return budget;
    },
    [token],
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      await BudgetRepository.remove(id);
      dispatch({ type: 'REMOVE_BUDGET', payload: id });

      if (token) {
        try {
          await budgetsApi.remove(id);
        } catch (e) {
          console.warn('⚠️ Budget backend delete warning:', e);
        }
      }
    },
    [token],
  );

  return (
    <BudgetContext.Provider value={{ ...state, getByMonth, upsertBudget, deleteBudget }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudgets must be inside BudgetProvider');
  return ctx;
}
