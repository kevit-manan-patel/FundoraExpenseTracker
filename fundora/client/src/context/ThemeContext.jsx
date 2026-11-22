import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'fundora-theme';
const LEGACY_STORAGE_KEY = 'fundora_theme';

function getInitialTheme() {
  const rootTheme = document.documentElement.getAttribute('data-theme');
  if (rootTheme === 'light' || rootTheme === 'dark') return rootTheme;

  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    if (savedTheme === null) {
      const legacyTheme = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyTheme === 'light' || legacyTheme === 'dark') return legacyTheme;
    }
  } catch (error) {
    console.warn('Could not read the saved Fundora theme preference.', error);
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, updateTheme] = useState(getInitialTheme);

  const setTheme = useCallback((nextTheme) => {
    updateTheme((currentTheme) => {
      const value = typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme;
      return value === 'light' ? 'light' : 'dark';
    });
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Could not save the Fundora theme preference.', error);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme,
    toggle: toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
