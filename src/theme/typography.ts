/**
 * TradeMind Typography System
 * Premium fintech typography with Inter font family
 */

import { Platform } from 'react-native';

// Font family configuration for Inter
export const fontFamily = {
  thin: Platform.select({
    ios: 'Inter-Thin',
    android: 'Inter_100Thin',
    default: 'Inter',
  }),
  extraLight: Platform.select({
    ios: 'Inter-ExtraLight',
    android: 'Inter_200ExtraLight',
    default: 'Inter',
  }),
  light: Platform.select({
    ios: 'Inter-Light',
    android: 'Inter_300Light',
    default: 'Inter',
  }),
  regular: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter_400Regular',
    default: 'Inter',
  }),
  medium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter_500Medium',
    default: 'Inter',
  }),
  semiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter_600SemiBold',
    default: 'Inter',
  }),
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter_700Bold',
    default: 'Inter',
  }),
  extraBold: Platform.select({
    ios: 'Inter-ExtraBold',
    android: 'Inter_800ExtraBold',
    default: 'Inter',
  }),
  black: Platform.select({
    ios: 'Inter-Black',
    android: 'Inter_900Black',
    default: 'Inter',
  }),
} as const;

// Type scale — follows a modular scale (1.25 ratio)
export const fontSize = {
  '2xs': 10,
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

// Line height multipliers
export const lineHeight = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
} as const;

// Pre-defined text styles
export const textStyles = {
  // Display — for hero numbers like total P&L
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['5xl'],
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  displaySmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // Body
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Labels (for form fields, card titles)
  labelLarge: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.snug,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.snug,
    letterSpacing: letterSpacing.wide,
  },
  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.snug,
    letterSpacing: letterSpacing.wider,
  },

  // Caption & Overline
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  overline: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize['2xs'],
    lineHeight: fontSize['2xs'] * lineHeight.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },

  // Numbers (for financial data)
  numberLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
    fontVariant: ['tabular-nums'] as any,
  },
  number: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
    fontVariant: ['tabular-nums'] as any,
  },
  numberSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
    fontVariant: ['tabular-nums'] as any,
  },
} as const;
