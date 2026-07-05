/**
 * TradeMind — Common Types
 */

// ── API Response ──
export interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: 'success' | 'error';
}

// ── Pagination ──
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// ── Filter & Sort ──
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DateRange {
  startDate: string; // ISO date
  endDate: string;   // ISO date
}

export type DatePreset = 'today' | 'this_week' | 'this_month' | 'this_year' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time' | 'custom';

// ── App State ──
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

// ── User ──
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// ── Settings ──
export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  language: 'id' | 'en';
  currency: string;
  defaultInstrument: string;
  defaultTimeframe: string;
  dailyJournalReminder: boolean;
  reminderTime: string; // HH:mm
  showProfitInPips: boolean;
  compactTradeList: boolean;
  hapticFeedback: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'id',
  currency: 'USD',
  defaultInstrument: 'forex',
  defaultTimeframe: 'H1',
  dailyJournalReminder: true,
  reminderTime: '20:00',
  showProfitInPips: true,
  compactTradeList: false,
  hapticFeedback: true,
};
