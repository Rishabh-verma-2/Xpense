import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

const STORAGE_KEY = '@xpense_savings_goal';

const SavingsGoalContext = createContext<SavingsGoalContextValue | null>(null);

export function SavingsGoalProvider({ children }: { children: ReactNode }) {
  const [goal, setGoalState] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setGoalState(JSON.parse(raw));
        }
      } catch (err) {
        console.warn('Failed to load savings goal:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (g: SavingsGoal | null) => {
    try {
      if (g) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(g));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to persist savings goal:', err);
    }
  }, []);

  const setGoal = useCallback(
    async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'achieved'>) => {
      const newGoal: SavingsGoal = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        achieved: false,
      };
      setGoalState(newGoal);
      await persist(newGoal);
    },
    [persist]
  );

  const updateSavedAmount = useCallback(
    async (amount: number) => {
      if (!goal) return;
      const updated: SavingsGoal = {
        ...goal,
        savedAmount: Math.max(0, amount),
        achieved: amount >= goal.targetAmount,
      };
      setGoalState(updated);
      await persist(updated);
    },
    [goal, persist]
  );

  const markAchieved = useCallback(async () => {
    if (!goal) return;
    const updated: SavingsGoal = { ...goal, achieved: true };
    setGoalState(updated);
    await persist(updated);
  }, [goal, persist]);

  const deleteGoal = useCallback(async () => {
    setGoalState(null);
    await persist(null);
  }, [persist]);

  return (
    <SavingsGoalContext.Provider
      value={{ goal, loading, setGoal, updateSavedAmount, markAchieved, deleteGoal }}
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
