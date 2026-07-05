/**
 * TradeMind — Database Schema & Initialization
 * Uses expo-sqlite for local-first storage
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'trademind.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initializeSchema(db);
  return db;
}

/**
 * Initialize all tables
 */
async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- ══════════════════════════════════════════
    -- Trading Accounts
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS trading_accounts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      broker TEXT NOT NULL DEFAULT '',
      account_number TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT 'manual' CHECK (platform IN ('mt4', 'mt5', 'manual')),
      currency TEXT NOT NULL DEFAULT 'USD',
      initial_balance REAL NOT NULL DEFAULT 0,
      current_balance REAL NOT NULL DEFAULT 0,
      is_connected INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      meta_api_account_id TEXT,
      last_sync_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at TEXT
    );

    -- ══════════════════════════════════════════
    -- Trades
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY NOT NULL,
      instrument TEXT NOT NULL CHECK (instrument IN ('forex', 'stocks', 'crypto', 'futures')),
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
      entry_price REAL NOT NULL,
      exit_price REAL,
      stop_loss REAL,
      take_profit REAL,
      lot_size REAL NOT NULL DEFAULT 0.01,
      leverage REAL,
      commission REAL NOT NULL DEFAULT 0,
      swap REAL NOT NULL DEFAULT 0,
      profit_loss REAL,
      profit_loss_pips REAL,
      risk_reward_ratio REAL,
      strategy TEXT NOT NULL DEFAULT '',
      timeframe TEXT NOT NULL DEFAULT 'H1',
      entry_date TEXT NOT NULL,
      exit_date TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
      screenshots TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      emotion_entry INTEGER CHECK (emotion_entry BETWEEN 1 AND 5),
      emotion_exit INTEGER CHECK (emotion_exit BETWEEN 1 AND 5),
      source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'mt4', 'mt5')),
      external_id TEXT,
      account_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at TEXT,
      FOREIGN KEY (account_id) REFERENCES trading_accounts(id) ON DELETE CASCADE
    );

    -- ══════════════════════════════════════════
    -- Journal Entries
    -- ══════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      emotion INTEGER NOT NULL DEFAULT 3 CHECK (emotion BETWEEN 1 AND 5),
      market_condition TEXT NOT NULL DEFAULT 'calm' CHECK (market_condition IN ('trending_up', 'trending_down', 'ranging', 'volatile', 'calm')),
      lessons_learned TEXT NOT NULL DEFAULT '',
      goals TEXT NOT NULL DEFAULT '',
      trade_ids TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at TEXT
    );

    -- ══════════════════════════════════════════
    -- Indexes for performance
    -- ══════════════════════════════════════════
    CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
    CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
    CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
    CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
    CREATE INDEX IF NOT EXISTS idx_trades_instrument ON trades(instrument);
    CREATE INDEX IF NOT EXISTS idx_trades_external_id ON trades(external_id);
    CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);
  `);
}

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
