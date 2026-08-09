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
  const [state, dispatch] = useReducer(reducer, { budgets: [], loading: true });

  useEffect(() => {
    (async () => {
      dispatch({ type: 'SET_LOADING' });
      const all = await BudgetRepository.getAll();
      dispatch({ type: 'SET_BUDGETS', payload: all });
    })();
  }, []);

  const getByMonth = useCallback(
    (month: string) => state.budgets.filter((b) => b.month === month),
    [state.budgets],
  );

  const upsertBudget = useCallback(
    async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const budget = await BudgetRepository.upsert(data);
      dispatch({ type: 'UPSERT_BUDGET', payload: budget });
      return budget;
    },
    [],
  );

  const deleteBudget = useCallback(async (id: string) => {
    await BudgetRepository.remove(id);
    dispatch({ type: 'REMOVE_BUDGET', payload: id });
  }, []);

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
