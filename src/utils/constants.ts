/**
 * TradeMind — Constants
 */

export const APP_NAME = 'TradeMind';
export const APP_VERSION = '1.0.0';

// ── Strategy Presets ──
export const STRATEGY_PRESETS = [
  'Breakout',
  'Pullback',
  'Scalping',
  'Swing Trading',
  'Trend Following',
  'Range Trading',
  'Mean Reversion',
  'Support & Resistance',
  'Moving Average Crossover',
  'Fibonacci Retracement',
  'RSI Divergence',
  'MACD Signal',
  'Price Action',
  'Supply & Demand',
  'Order Block',
  'Smart Money Concept',
  'ICT',
  'Elliott Wave',
  'Harmonic Pattern',
  'News Trading',
  'Other',
] as const;

// ── Tag Presets ──
export const TAG_PRESETS = [
  'Planned',
  'Impulsive',
  'Revenge Trade',
  'FOMO',
  'News Event',
  'Asian Session',
  'London Session',
  'New York Session',
  'High Volume',
  'Low Volume',
  'Key Level',
  'Trend Trade',
  'Counter-Trend',
  'Break Even',
  'Partial Close',
  'Scaled In',
  'Scaled Out',
] as const;

// ── Broker Presets ──
export const BROKER_PRESETS = [
  'Exness',
  'XM',
  'FBS',
  'OctaFX',
  'IC Markets',
  'Pepperstone',
  'RoboForex',
  'FXCM',
  'IG',
  'OANDA',
  'Binance',
  'Bybit',
  'Other',
] as const;

// ── Currency Options ──
export const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'IDR',
] as const;

// ── Storage Keys ──
export const STORAGE_KEYS = {
  THEME: 'trademind_theme',
  SETTINGS: 'trademind_settings',
  AUTH_TOKEN: 'trademind_auth_token',
  ONBOARDING_COMPLETE: 'trademind_onboarding',
  LAST_SYNC: 'trademind_last_sync',
} as const;

// ── Animation Durations ──
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;
