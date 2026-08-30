import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goalsApi } from '../services/api';
import { useAuth } from './AuthContext';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string; // ISO date string YYYY-MM-DD
  emoji: string;
  createdAt: string;
  achieved: boolean;
}

interface SavingsGoalContextValue {
  goal: SavingsGoal | null;
  loading: boolean;
  setGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'achieved'>) => Promise<void>;
  updateSavedAmount: (amount: number) => Promise<void>;
  markAchieved: () => Promise<void>;
  deleteGoal: () => Promise<void>;
  refreshGoal: () => Promise<void>;
}

const STORAGE_KEY = '@xpense_savings_goal';

const SavingsGoalContext = createContext<SavingsGoalContextValue | null>(null);

export function SavingsGoalProvider({ children }: { children: ReactNode }) {
  const [goal, setGoalState] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Helper to map backend MongoDB Goal document to frontend SavingsGoal interface
  const mapServerGoal = (data: any): SavingsGoal | null => {
    if (!data) return null;
    return {
      id: data.id || data._id || Date.now().toString(),
      name: data.name,
      targetAmount: Number(data.targetAmount) || 0,
      savedAmount: Number(data.savedAmount) || 0,
      targetDate: data.deadline
        ? new Date(data.deadline).toISOString().split('T')[0]
        : '',
      emoji: data.emoji || '🎯',
      createdAt: data.createdAt || new Date().toISOString(),
      achieved: Boolean(data.isCompleted) || (Number(data.savedAmount) >= Number(data.targetAmount)),
    };
  };

  // Synchronize from DB (with local cache fallback)
  const refreshGoal = useCallback(async () => {
    // 1. First read local cache for instant UI rendering
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setGoalState(JSON.parse(raw));
      }
    } catch (err) {
      console.warn('[SavingsGoal] Local cache read error:', err);
    }

    // 2. If authenticated, fetch authoritative goal record from MongoDB Atlas
    if (token) {
      try {
        const res = await goalsApi.get();
        if (res?.success && res.data) {
          const mapped = mapServerGoal(res.data);
          setGoalState(mapped);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        } else if (res?.success && res.data === null) {
          // Explicitly null on backend
          setGoalState(null);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn('[SavingsGoal] Remote DB fetch error:', err);
      }
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshGoal();
      setLoading(false);
    })();
  }, [refreshGoal]);

  const persist = useCallback(async (g: SavingsGoal | null) => {
    try {
      if (g) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(g));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[SavingsGoal] Failed to persist cache:', err);
    }
  }, []);

  // Set / Upsert Goal
  const setGoal = useCallback(
    async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'achieved'>) => {
      const optimisticGoal: SavingsGoal = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        achieved: data.savedAmount >= data.targetAmount,
      };

      // Optimistic local update
      setGoalState(optimisticGoal);
      await persist(optimisticGoal);

      // Persist to MongoDB Atlas backend
      try {
        const res = await goalsApi.upsert({
          name: data.name,
          targetAmount: data.targetAmount,
          savedAmount: data.savedAmount,
          deadline: data.targetDate,
          emoji: data.emoji,
        });

        if (res?.success && res.data) {
          const confirmed = mapServerGoal(res.data);
          if (confirmed) {
            setGoalState(confirmed);
            await persist(confirmed);
          }
        }
      } catch (err) {
        console.warn('[SavingsGoal] Failed to sync goal to MongoDB:', err);
      }
    },
    [persist]
  );

  // Update progress amount
  const updateSavedAmount = useCallback(
    async (amount: number) => {
      if (!goal) return;
      const normalizedAmount = Math.max(0, amount);
      const updated: SavingsGoal = {
        ...goal,
        savedAmount: normalizedAmount,
        achieved: normalizedAmount >= goal.targetAmount,
      };

      setGoalState(updated);
      await persist(updated);

      try {
        await goalsApi.updateProgress(normalizedAmount);
      } catch (err) {
        console.warn('[SavingsGoal] Failed to sync progress to MongoDB:', err);
      }
    },
    [goal, persist]
  );

  // Mark achieved
  const markAchieved = useCallback(async () => {
    if (!goal) return;
    const updated: SavingsGoal = { ...goal, achieved: true };
    setGoalState(updated);
    await persist(updated);

    try {
      await goalsApi.updateProgress(goal.targetAmount);
    } catch (err) {
      console.warn('[SavingsGoal] Failed to mark achieved in MongoDB:', err);
    }
  }, [goal, persist]);

  // Delete goal
  const deleteGoal = useCallback(async () => {
    setGoalState(null);
    await persist(null);

    try {
      await goalsApi.remove();
    } catch (err) {
      console.warn('[SavingsGoal] Failed to remove goal from MongoDB:', err);
    }
  }, [persist]);

  return (
    <SavingsGoalContext.Provider
      value={{ goal, loading, setGoal, updateSavedAmount, markAchieved, deleteGoal, refreshGoal }}
    >
      {children}
    </SavingsGoalContext.Provider>
  );
}

export function useSavingsGoal() {
  const ctx = useContext(SavingsGoalContext);
  if (!ctx) throw new Error('useSavingsGoal must be used inside SavingsGoalProvider');
  return ctx;
}
