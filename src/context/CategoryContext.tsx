import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { Category } from '../shared/types/category.types';
import { CategoryRepository } from '../storage/repositories/CategoryRepository';

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: string }
  | { type: 'SET_ERROR'; payload: string };

function reducer(state: CategoryState, action: Action): CategoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true };
    case 'SET_CATEGORIES':
      return { categories: action.payload, loading: false, error: null };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };
    case 'REMOVE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

interface CategoryContextValue {
  categories: Category[];
  loading: boolean;
  error: string | null;
  getById: (id: string) => Category | undefined;
  getByType: (type: 'expense' | 'income') => Category[];
  addCategory: (data: Omit<Category, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>) => Promise<Category>;
  updateCategory: (id: string, changes: Partial<Omit<Category, 'id' | 'isSystem' | 'createdAt'>>) => Promise<Category>;
  archiveCategory: (id: string) => Promise<void>;
  unarchiveCategory: (id: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    categories: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    (async () => {
      dispatch({ type: 'SET_LOADING' });
      try {
        await CategoryRepository.seed();
        const all = await CategoryRepository.getAll();
        dispatch({ type: 'SET_CATEGORIES', payload: all });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: "Couldn't load categories" });
      }
    })();
  }, []);

  const getById = useCallback(
    (id: string) => state.categories.find((c) => c.id === id),
    [state.categories],
  );

  const getByType = useCallback(
    (type: 'expense' | 'income') =>
      state.categories
        .filter((c) => c.type === type && !c.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [state.categories],
  );

  const addCategory = useCallback(
    async (data: Omit<Category, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>) => {
      const category = await CategoryRepository.create(data);
      dispatch({ type: 'ADD_CATEGORY', payload: category });
      return category;
    },
    [],
  );

  const updateCategory = useCallback(
    async (id: string, changes: Partial<Omit<Category, 'id' | 'isSystem' | 'createdAt'>>) => {
      const updated = await CategoryRepository.update(id, changes);
      dispatch({ type: 'UPDATE_CATEGORY', payload: updated });
      return updated;
    },
    [],
  );

  const archiveCategory = useCallback(async (id: string) => {
    await CategoryRepository.archive(id);
    const updated = await CategoryRepository.getAll();
    dispatch({ type: 'SET_CATEGORIES', payload: updated });
  }, []);

  const unarchiveCategory = useCallback(async (id: string) => {
    await CategoryRepository.unarchive(id);
    const updated = await CategoryRepository.getAll();
    dispatch({ type: 'SET_CATEGORIES', payload: updated });
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    await CategoryRepository.remove(id);
    dispatch({ type: 'REMOVE_CATEGORY', payload: id });
  }, []);

  return (
    <CategoryContext.Provider
      value={{
        ...state,
        getById,
        getByType,
        addCategory,
        updateCategory,
        archiveCategory,
        unarchiveCategory,
        removeCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be inside CategoryProvider');
  return ctx;
}
