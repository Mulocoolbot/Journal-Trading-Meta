/**
 * TradeMind Theme — Central Export
 * Provides theme context and hooks for dark/light mode
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, palette, type ThemeColors } from './colors';
import { fontFamily, fontSize, lineHeight, letterSpacing, textStyles } from './typography';
import { spacing, borderRadius, shadows, dimensions } from './spacing';

// Re-export everything
export { palette, darkTheme, lightTheme } from './colors';
export { fontFamily, fontSize, lineHeight, letterSpacing, textStyles } from './typography';
export { spacing, borderRadius, shadows, dimensions } from './spacing';

// Theme mode type
export type ThemeMode = 'dark' | 'light' | 'system';

// Complete theme object
export interface Theme {
  colors: ThemeColors;
  typography: typeof textStyles;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  dimensions: typeof dimensions;
  isDark: boolean;
}

// Build a complete theme from mode
function buildTheme(isDark: boolean): Theme {
  return {
    colors: (isDark ? darkTheme : lightTheme) as unknown as ThemeColors,
    typography: textStyles,
    fontFamily,
    fontSize,
    spacing,
    borderRadius,
    shadows,
    dimensions,
    isDark,
  };
}

// Theme context
interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme Provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark'); // Default to dark

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme !== 'light';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const theme = useMemo(() => buildTheme(isDark), [isDark]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'dark';
      // If system, switch to opposite of current
      return isDark ? 'light' : 'dark';
    });
  }, [isDark]);

  const value = useMemo(
    () => ({ theme, themeMode, setThemeMode, toggleTheme }),
    [theme, themeMode, toggleTheme]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

// Hook to access theme
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback to dark theme if not in provider
    return buildTheme(true);
  }
  return context.theme;
}

// Hook to access theme controls
export function useThemeControls() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeControls must be used within ThemeProvider');
  }
  return {
    themeMode: context.themeMode,
    setThemeMode: context.setThemeMode,
    toggleTheme: context.toggleTheme,
  };
}
