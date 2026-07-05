/**
 * TradeMind Spacing & Layout System
 */

// Base spacing unit = 4px
const BASE = 4;

export const spacing = {
  '0': 0,
  '0.5': BASE * 0.5,   // 2
  '1': BASE,            // 4
  '1.5': BASE * 1.5,    // 6
  '2': BASE * 2,        // 8
  '2.5': BASE * 2.5,    // 10
  '3': BASE * 3,        // 12
  '4': BASE * 4,        // 16
  '5': BASE * 5,        // 20
  '6': BASE * 6,        // 24
  '7': BASE * 7,        // 28
  '8': BASE * 8,        // 32
  '9': BASE * 9,        // 36
  '10': BASE * 10,      // 40
  '12': BASE * 12,      // 48
  '14': BASE * 14,      // 56
  '16': BASE * 16,      // 64
  '20': BASE * 20,      // 80
  '24': BASE * 24,      // 96
  '32': BASE * 32,      // 128
} as const;

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  }),
} as const;

// Standard dimensions
export const dimensions = {
  tabBarHeight: 88,
  headerHeight: 56,
  inputHeight: 48,
  buttonHeight: 48,
  buttonHeightSm: 36,
  buttonHeightLg: 56,
  cardPadding: spacing['4'],
  screenPadding: spacing['4'],
  iconSizeSm: 16,
  iconSizeMd: 20,
  iconSizeLg: 24,
  iconSizeXl: 32,
} as const;
