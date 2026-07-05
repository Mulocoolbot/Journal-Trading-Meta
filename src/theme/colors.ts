/**
 * TradeMind Color System
 * Premium fintech-inspired palette with dark & light modes
 */

export const palette = {
  // Primary — Deep Indigo / Electric Blue
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main primary
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
  },

  // Accent — Vivid Cyan / Teal
  accent: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4', // Main accent
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
    950: '#083344',
  },

  // Success — Emerald Green (Profit)
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Main success / profit
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
  },

  // Danger — Rose Red (Loss)
  danger: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E', // Main danger / loss
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
    950: '#4C0519',
  },

  // Warning — Amber / Gold
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },

  // Neutral — Cool Gray
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
} as const;

export const darkTheme = {
  // Backgrounds
  background: palette.neutral[950],
  backgroundSecondary: palette.neutral[900],
  backgroundTertiary: palette.neutral[800],
  backgroundElevated: '#0D1321',
  surface: 'rgba(30, 41, 59, 0.7)', // Glassmorphism surface
  surfaceHover: 'rgba(30, 41, 59, 0.9)',

  // Text
  text: palette.neutral[50],
  textSecondary: palette.neutral[400],
  textTertiary: palette.neutral[500],
  textInverse: palette.neutral[950],

  // Borders
  border: 'rgba(148, 163, 184, 0.15)',
  borderFocused: palette.primary[500],
  borderSubtle: 'rgba(148, 163, 184, 0.08)',

  // Brand
  primary: palette.primary[500],
  primaryLight: palette.primary[400],
  primaryDark: palette.primary[700],
  accent: palette.accent[400],
  accentLight: palette.accent[300],

  // Semantic
  profit: palette.success[400],
  profitBackground: 'rgba(16, 185, 129, 0.12)',
  loss: palette.danger[400],
  lossBackground: 'rgba(244, 63, 94, 0.12)',
  warning: palette.warning[400],
  warningBackground: 'rgba(245, 158, 11, 0.12)',

  // Gradients
  gradientPrimary: ['#4F46E5', '#6366F1', '#818CF8'] as const,
  gradientAccent: ['#0891B2', '#06B6D4', '#22D3EE'] as const,
  gradientProfit: ['#047857', '#059669', '#10B981'] as const,
  gradientLoss: ['#BE123C', '#E11D48', '#F43F5E'] as const,
  gradientCard: ['rgba(15, 23, 42, 0.9)', 'rgba(30, 41, 59, 0.6)'] as const,
  gradientGlass: ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.4)'] as const,

  // Overlays
  overlay: 'rgba(2, 6, 23, 0.7)',
  overlayLight: 'rgba(2, 6, 23, 0.4)',

  // Shadows (for elevated surfaces in dark mode)
  shadowColor: 'rgba(0, 0, 0, 0.5)',

  // Tab Bar
  tabBarBackground: 'rgba(15, 23, 42, 0.95)',
  tabBarActive: palette.primary[400],
  tabBarInactive: palette.neutral[500],

  // Status Bar
  statusBarStyle: 'light' as const,
} as const;

export const lightTheme = {
  // Backgrounds
  background: palette.neutral[50],
  backgroundSecondary: palette.neutral[0],
  backgroundTertiary: palette.neutral[100],
  backgroundElevated: palette.neutral[0],
  surface: 'rgba(255, 255, 255, 0.8)',
  surfaceHover: 'rgba(255, 255, 255, 0.95)',

  // Text
  text: palette.neutral[900],
  textSecondary: palette.neutral[600],
  textTertiary: palette.neutral[400],
  textInverse: palette.neutral[0],

  // Borders
  border: 'rgba(203, 213, 225, 0.5)',
  borderFocused: palette.primary[500],
  borderSubtle: 'rgba(203, 213, 225, 0.3)',

  // Brand
  primary: palette.primary[600],
  primaryLight: palette.primary[500],
  primaryDark: palette.primary[800],
  accent: palette.accent[600],
  accentLight: palette.accent[500],

  // Semantic
  profit: palette.success[600],
  profitBackground: 'rgba(16, 185, 129, 0.08)',
  loss: palette.danger[600],
  lossBackground: 'rgba(244, 63, 94, 0.08)',
  warning: palette.warning[600],
  warningBackground: 'rgba(245, 158, 11, 0.08)',

  // Gradients
  gradientPrimary: ['#4F46E5', '#6366F1', '#818CF8'] as const,
  gradientAccent: ['#0891B2', '#06B6D4', '#22D3EE'] as const,
  gradientProfit: ['#047857', '#059669', '#10B981'] as const,
  gradientLoss: ['#BE123C', '#E11D48', '#F43F5E'] as const,
  gradientCard: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.8)'] as const,
  gradientGlass: ['rgba(255, 255, 255, 0.7)', 'rgba(248, 250, 252, 0.4)'] as const,

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.2)',

  // Shadows
  shadowColor: 'rgba(15, 23, 42, 0.08)',

  // Tab Bar
  tabBarBackground: 'rgba(255, 255, 255, 0.95)',
  tabBarActive: palette.primary[600],
  tabBarInactive: palette.neutral[400],

  // Status Bar
  statusBarStyle: 'dark' as const,
} as const;

export type ThemeColors = typeof darkTheme;
