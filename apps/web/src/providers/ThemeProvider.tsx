'use client';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createAppTheme } from './createAppTheme';

type Mode = 'light' | 'dark';
const Ctx = createContext<{ mode: Mode; toggle: () => void }>({ mode: 'light', toggle: () => {} });
export const useThemeMode = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('light');
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('fa_theme');
      if (saved === 'dark' || saved === 'light') setMode(saved);
    } catch {}
  }, []);
  const toggle = useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem('fa_theme', next);
      } catch {}
      return next;
    });
  }, []);
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <Ctx.Provider value={{ mode, toggle }}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </Ctx.Provider>
    </AppRouterCacheProvider>
  );
}
