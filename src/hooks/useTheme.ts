import { useContext } from 'react';
import { ThemeContext } from '../context/themeContextInstance';
import type { ThemeContextType, Theme } from '../context/themeContextInstance';

export type { ThemeContextType, Theme };

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
