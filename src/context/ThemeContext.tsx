import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeId, ThemeDefinition, THEMES, DEFAULT_THEME_ID } from '../core/theme/themes';

interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeDefinition;
  setThemeId: (id: ThemeId) => Promise<void>;
  availableThemes: ThemeDefinition[];
}

const STORAGE_KEY = '@xpense_custom_theme_id';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setCurrentThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && (saved in THEMES)) {
          setCurrentThemeId(saved as ThemeId);
        }
      } catch (err) {
        console.warn('Failed to load saved theme:', err);
      }
    })();
  }, []);

  const setThemeId = useCallback(async (id: ThemeId) => {
    if (id in THEMES) {
      setCurrentThemeId(id);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, id);
      } catch (err) {
        console.warn('Failed to persist theme:', err);
      }
    }
  }, []);

  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const availableThemes = Object.values(THEMES);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme,
        setThemeId,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback to default theme if used outside provider
    return {
      themeId: DEFAULT_THEME_ID,
      theme: THEMES[DEFAULT_THEME_ID],
      setThemeId: async () => {},
      availableThemes: Object.values(THEMES),
    };
  }
  return context;
}
