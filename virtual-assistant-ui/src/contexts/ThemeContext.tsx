import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getActiveTheme, activateTheme as apiActivateTheme } from '../api/themesApi';
import type { Theme } from '../types';

interface ThemeContextType {
  activeTheme: Theme | null;
  activateTheme: (id: string) => Promise<void>;
  refreshTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: null,
  activateTheme: async () => {},
  refreshTheme: () => {},
});

function applyCssVars(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-dark', theme.primaryDark);
  root.style.setProperty('--primary-light', theme.primaryLight);
  root.style.setProperty('--sidebar-bg', theme.sidebarBg);
  root.style.setProperty('--sidebar-active', theme.sidebarActive);
  root.style.setProperty('--sidebar-hover', theme.sidebarHover);
  root.style.setProperty('--sidebar-text', theme.sidebarText);
  root.style.setProperty('--sidebar-subtext', theme.sidebarSubtext);
  root.style.setProperty('--sidebar-border', theme.sidebarBorder);
  root.style.setProperty('--page-bg', theme.pageBg);
  root.style.setProperty('--card-bg', theme.cardBg);
  root.style.setProperty('--text-primary', theme.textPrimary);
  root.style.setProperty('--text-muted', theme.textMuted);
  root.style.setProperty('--border-color', theme.borderColor);
  root.style.setProperty('--table-header-bg', theme.tableHeaderBg);
  root.style.setProperty('--input-bg', theme.inputBg);
  // data-dark enables dark-mode Tailwind overrides in index.css
  if (theme.isDark) {
    root.setAttribute('data-dark', '');
  } else {
    root.removeAttribute('data-dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveThemeState] = useState<Theme | null>(null);

  const load = useCallback(() => {
    getActiveTheme()
      .then(theme => {
        if (theme) {
          setActiveThemeState(theme);
          applyCssVars(theme);
        }
      })
      .catch(() => {/* keep CSS defaults */});
  }, []);

  useEffect(() => { load(); }, [load]);

  const activateTheme = async (id: string) => {
    const theme = await apiActivateTheme(id);
    setActiveThemeState(theme);
    applyCssVars(theme);
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, activateTheme, refreshTheme: load }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
