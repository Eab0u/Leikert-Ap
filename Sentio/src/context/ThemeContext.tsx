import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { Palettes, type Palette } from '@/constants/theme';

export type AppearanceMode = 'system' | 'light' | 'dark';

const MODE_KEY = 'sentio.appearance';

interface ThemeContextValue {
  palette: Palette;
  scheme: 'light' | 'dark';
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<AppearanceMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      })
      .catch(() => {
        // fall back to system mode
      });
  }, []);

  const setMode = useCallback((next: AppearanceMode) => {
    setModeState(next);
    AsyncStorage.setItem(MODE_KEY, next).catch(() => {
      // non-fatal: the preference just won't persist
    });
  }, []);

  const scheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ palette: Palettes[scheme], scheme, mode, setMode }),
    [scheme, mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used inside ThemeContextProvider');
  }
  return ctx;
}
