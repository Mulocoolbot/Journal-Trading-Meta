/**
 * TradeMind — Supabase Sync Service
 * Handles MT4/MT5 integration via user's private Supabase instance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SUPABASE_URL: 'trademind_supabase_url',
  SUPABASE_ANON_KEY: 'trademind_supabase_anon_key',
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseTrade {
  ticket: number;
  account_number: string;
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  commission: number;
  swap: number;
  profit_loss: number;
  entry_date: string; // ISO date string
  exit_date: string; // ISO date string
  comment: string;
  source?: string;
}

/**
 * Get Supabase configuration from AsyncStorage or .env fallback
 */
export async function getSupabaseConfig(): Promise<SupabaseConfig> {
  const storedUrl = await AsyncStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const storedKey = await AsyncStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);

  return {
    url: storedUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: storedKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

/**
 * Save Supabase configuration to AsyncStorage
 */
export async function saveSupabaseConfig(url: string, anonKey: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  await AsyncStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
}

/**
 * Clear Supabase configuration from AsyncStorage
 */
export async function clearSupabaseConfig(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  await AsyncStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
}

/**
 * Fetch closed trades from Supabase for a specific trading account number
 */
export async function fetchSupabaseTrades(
  accountNumber: string
): Promise<SupabaseTrade[]> {
  const { url, anonKey } = await getSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error('Supabase URL atau Anon Key belum dikonfigurasi.');
  }

  // Sanitize URL
  const cleanUrl = url.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/rest/v1/mt_sync_trades?account_number=eq.${accountNumber}&order=exit_date.asc`;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase Error [${response.status}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Guess instrument type from symbol name
 */
export function guessInstrument(symbol: string): 'forex' | 'stocks' | 'crypto' | 'futures' {
  const upper = symbol.toUpperCase();

  // Crypto
  if (['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'DOT', 'DOGE'].some(c => upper.includes(c))) {
    return 'crypto';
  }

  // Indices / Futures
  if (['US30', 'US500', 'NAS', 'DAX', 'FTSE', 'JP225', 'OIL', 'GAS', 'USOIL', 'UKOIL'].some(f => upper.includes(f))) {
    return 'futures';
  }

  // Default to forex (including metals like XAUUSD, XAGUSD)
  return 'forex';
}

/**
 * Convert Supabase trade structure to TradeMind SQLite DB model
 */
export function mapSupabaseTradeToLocal(
  sbTrade: SupabaseTrade,
  localAccountId: string,
  platform: 'mt4' | 'mt5'
) {
  const instrument = guessInstrument(sbTrade.symbol);

  return {
    instrument,
    symbol: sbTrade.symbol,
    direction: sbTrade.direction,
    entryPrice: sbTrade.entry_price,
    exitPrice: sbTrade.exit_price,
    stopLoss: sbTrade.stop_loss,
    takeProfit: sbTrade.take_profit,
    lotSize: sbTrade.lot_size,
    leverage: null,
    commission: sbTrade.commission,
    swap: sbTrade.swap,
    profitLoss: sbTrade.profit_loss,
    profitLossPips: null,
    riskRewardRatio: null,
    strategy: '',
    timeframe: 'H1' as const,
    entryDate: sbTrade.entry_date,
    exitDate: sbTrade.exit_date,
    status: 'closed' as const,
    screenshots: [],
    notes: sbTrade.comment || '',
    tags: [],
    emotionEntry: null,
    emotionExit: null,
    source: platform,
    externalId: String(sbTrade.ticket),
    accountId: localAccountId,
  };
}
