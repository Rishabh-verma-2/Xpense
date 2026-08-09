import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { Settings } from '../shared/types/settings.types';
import { SettingsRepository } from '../storage/repositories/SettingsRepository';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
}

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_SETTINGS'; payload: Settings };

function reducer(state: SettingsState, action: Action): SettingsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true };
    case 'SET_SETTINGS':
      return { settings: action.payload, loading: false };
    default:
      return state;
  }
}

interface SettingsContextValue {
  settings: Settings | null;
  loading: boolean;
  updateSettings: (changes: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { settings: null, loading: true });

  useEffect(() => {
    (async () => {
      dispatch({ type: 'SET_LOADING' });
      const settings = await SettingsRepository.initDefaults();
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    })();
  }, []);

  const updateSettings = useCallback(async (changes: Partial<Settings>) => {
    const updated = await SettingsRepository.update(changes);
    dispatch({ type: 'SET_SETTINGS', payload: updated });
  }, []);

  return (
    <SettingsContext.Provider value={{ ...state, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
