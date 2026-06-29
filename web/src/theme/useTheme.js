import { useCallback, useEffect, useState } from 'react';
import { applyTheme, readAppliedTheme } from './applyTheme.js';
import { saveTheme } from './storage.js';

export function useTheme() {
  const [theme, setThemeState] = useState(() => readAppliedTheme());

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === 'light' ? 'light' : 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
