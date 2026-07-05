/**
 * TradeMind — Core Trade Types
 * Type definitions for all trade-related data
 */

// ── Instrument Types ──
export type Instrument = 'forex' | 'stocks' | 'crypto' | 'futures';

export type TradeDirection = 'long' | 'short';

export type TradeStatus = 'open' | 'closed' | 'cancelled';

export type TradeSource = 'manual' | 'mt4' | 'mt5';

// ── Timeframes ──
export type Timeframe =
  | 'M1' | 'M5' | 'M15' | 'M30'
  | 'H1' | 'H4'
  | 'D1' | 'W1' | 'MN';

// ── Emotion Scale ──
export type EmotionLevel = 1 | 2 | 3 | 4 | 5;

export const EMOTION_LABELS: Record<EmotionLevel, { label: string; emoji: string; color: string }> = {
  1: { label: 'Sangat Takut', emoji: '😰', color: '#F43F5E' },
  2: { label: 'Cemas', emoji: '😟', color: '#FB923C' },
  3: { label: 'Netral', emoji: '😐', color: '#FBBF24' },
  4: { label: 'Percaya Diri', emoji: '😊', color: '#34D399' },
  5: { label: 'Sangat Yakin', emoji: '🔥', color: '#10B981' },
};

// ── Market Condition ──
export type MarketCondition = 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'calm';

export const MARKET_CONDITION_LABELS: Record<MarketCondition, { label: string; emoji: string }> = {
  trending_up: { label: 'Trending Up', emoji: '📈' },
  trending_down: { label: 'Trending Down', emoji: '📉' },
  ranging: { label: 'Ranging', emoji: '↔️' },
  volatile: { label: 'Volatile', emoji: '🌊' },
  calm: { label: 'Calm', emoji: '😴' },
};

// ── Trade Model ──
export interface Trade {
  id: string;
  instrument: Instrument;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  lotSize: number;
  leverage: number | null;
  commission: number;
  swap: number;
  profitLoss: number | null;
  profitLossPips: number | null;
  riskRewardRatio: number | null;
  strategy: string;
  timeframe: Timeframe;
  entryDate: string; // ISO date string
  exitDate: string | null;
  status: TradeStatus;
  screenshots: string[];
  notes: string;
  tags: string[];
  emotionEntry: EmotionLevel | null;
  emotionExit: EmotionLevel | null;
  source: TradeSource;
  externalId: string | null; // MT4/MT5 ticket number
  accountId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
}

// ── Journal Entry Model ──
export interface JournalEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  title: string;
  content: string;
  emotion: EmotionLevel;
  marketCondition: MarketCondition;
  lessonsLearned: string;
  goals: string;
  tradeIds: string[];
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
}

// ── Trading Account Model ──
export interface TradingAccount {
  id: string;
  name: string;
  broker: string;
  accountNumber: string;
  platform: 'mt4' | 'mt5' | 'manual';
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isConnected: boolean;
  isDefault: boolean;
  metaApiAccountId: string | null;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Form Types ──
export interface TradeFormData {
  instrument: Instrument;
  symbol: string;
  direction: TradeDirection;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  lotSize: string;
  leverage: string;
  commission: string;
  swap: string;
  strategy: string;
  timeframe: Timeframe;
  entryDate: Date;
  exitDate: Date | null;
  status: TradeStatus;
  notes: string;
  tags: string[];
  emotionEntry: EmotionLevel | null;
  emotionExit: EmotionLevel | null;
  accountId: string;
}

// ── Statistics Types ──
export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  averageRiskReward: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number | null;
  expectancy: number;
}

export interface DailyStats {
  date: string;
  trades: number;
  profitLoss: number;
  winRate: number;
  emotion: EmotionLevel | null;
}

export interface PairStats {
  symbol: string;
  instrument: Instrument;
  totalTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageProfitLoss: number;
}

export interface StrategyStats {
  strategy: string;
  totalTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageRiskReward: number;
  profitFactor: number;
}

// ── Calendar Types ──
export interface CalendarDay {
  date: string;
  trades: number;
  profitLoss: number;
  isProfit: boolean;
  hasJournal: boolean;
}

// ── Common symbol lists ──
export const FOREX_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'GBPCHF',
  'CADJPY', 'GBPAUD', 'AUDCAD', 'AUDNZD', 'NZDJPY', 'NZDCAD',
  'XAUUSD', 'XAGUSD', // Gold & Silver
] as const;

export const CRYPTO_PAIRS = [
  'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'SOLUSD', 'ADAUSD',
  'DOTUSD', 'DOGEUSD', 'AVAXUSD', 'LINKUSD', 'MATICUSD', 'UNIUSD',
] as const;

export const TIMEFRAMES: Timeframe[] = [
  'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN',
];

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  M1: '1 Minute',
  M5: '5 Minutes',
  M15: '15 Minutes',
  M30: '30 Minutes',
  H1: '1 Hour',
  H4: '4 Hours',
  D1: 'Daily',
  W1: 'Weekly',
  MN: 'Monthly',
};
