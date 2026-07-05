/**
 * TradeMind — Data Store (Zustand)
 * Manages fetching, adding, updating, and deleting records from SQLite
 */

import { create } from 'zustand';
import { getDatabase, generateId } from '@/src/database';
import type { Trade, TradingAccount, JournalEntry } from '@/src/types/trade';
import { deployAccount, undeployAccount, listAccounts, getDealHistory, getAccountInfo, mapDealToTrade, deleteAccount as deleteAccountFromMetaApi } from '@/src/features/metatrader/services/metaApiService';
import { fetchSupabaseTrades, mapSupabaseTradeToLocal } from '@/src/features/metatrader/services/supabaseSyncService';

// SQLite DB types matching schemas
interface DbAccount {
  id: string;
  name: string;
  broker: string;
  account_number: string;
  platform: 'mt4' | 'mt5' | 'manual';
  currency: string;
  initial_balance: number;
  current_balance: number;
  is_connected: number;
  is_default: number;
  meta_api_account_id: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DbTrade {
  id: string;
  instrument: 'forex' | 'stocks' | 'crypto' | 'futures';
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  leverage: number | null;
  commission: number;
  swap: number;
  profit_loss: number | null;
  profit_loss_pips: number | null;
  risk_reward_ratio: number | null;
  strategy: string;
  timeframe: string;
  entry_date: string;
  exit_date: string | null;
  status: 'open' | 'closed' | 'cancelled';
  screenshots: string; // JSON text
  notes: string;
  tags: string; // JSON text
  emotion_entry: number | null;
  emotion_exit: number | null;
  source: 'manual' | 'mt4' | 'mt5';
  external_id: string | null;
  account_id: string;
  created_at: string;
  updated_at: string;
}

interface DbJournal {
  id: string;
  date: string;
  title: string;
  content: string;
  emotion: number;
  market_condition: 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'calm';
  lessons_learned: string;
  goals: string;
  trade_ids: string; // JSON text
  created_at: string;
  updated_at: string;
}

// ── Mapping Helpers ──

function mapDbAccount(row: DbAccount): TradingAccount {
  return {
    id: row.id,
    name: row.name,
    broker: row.broker,
    accountNumber: row.account_number,
    platform: row.platform,
    currency: row.currency,
    initialBalance: row.initial_balance,
    currentBalance: row.current_balance,
    isConnected: row.is_connected === 1,
    isDefault: row.is_default === 1,
    metaApiAccountId: row.meta_api_account_id,
    lastSyncAt: row.last_sync_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbTrade(row: DbTrade): Trade {
  return {
    id: row.id,
    instrument: row.instrument,
    symbol: row.symbol,
    direction: row.direction,
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    lotSize: row.lot_size,
    leverage: row.leverage,
    commission: row.commission,
    swap: row.swap,
    profitLoss: row.profit_loss,
    profitLossPips: row.profit_loss_pips,
    riskRewardRatio: row.risk_reward_ratio,
    strategy: row.strategy,
    timeframe: row.timeframe as any,
    entryDate: row.entry_date,
    exitDate: row.exit_date,
    status: row.status,
    screenshots: JSON.parse(row.screenshots || '[]'),
    notes: row.notes,
    tags: JSON.parse(row.tags || '[]'),
    emotionEntry: row.emotion_entry as any,
    emotionExit: row.emotion_exit as any,
    source: row.source,
    externalId: row.external_id,
    accountId: row.account_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: null,
  };
}

function mapDbJournal(row: DbJournal): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    content: row.content,
    emotion: row.emotion as any,
    marketCondition: row.market_condition,
    lessonsLearned: row.lessons_learned,
    goals: row.goals,
    tradeIds: JSON.parse(row.trade_ids || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: null,
  };
}

// ── State Definition ──

interface DataState {
  accounts: TradingAccount[];
  trades: Trade[];
  journalEntries: JournalEntry[];
  isLoading: boolean;
  error: string | null;

  initData: () => Promise<void>;

  // Account CRUD
  addAccount: (account: Omit<TradingAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAccount: (id: string, account: Partial<TradingAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  setDefaultAccount: (id: string) => Promise<void>;

  // Trade CRUD
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>) => Promise<string>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;

  // Journal Entry CRUD
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>) => Promise<string>;
  updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Sync actions
  syncMetaApiTrades: (accountId: string) => Promise<void>;
  syncSupabaseTrades: (accountId: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  accounts: [],
  trades: [],
  journalEntries: [],
  isLoading: false,
  error: null,

  initData: async () => {
    set({ isLoading: true, error: null });
    try {
      const database = await getDatabase();

      // Fix legacy accounts where platform was set to MT4/MT5 but no MetaApi ID is linked
      await database.runAsync(`
        UPDATE trading_accounts
        SET platform = 'manual'
        WHERE platform IN ('mt4', 'mt5') AND (meta_api_account_id IS NULL OR meta_api_account_id = '')
      `);

      // Fetch accounts
      const dbAccounts = await database.getAllAsync<DbAccount>(
        'SELECT * FROM trading_accounts ORDER BY is_default DESC, name ASC'
      );
      const accounts = dbAccounts.map(mapDbAccount);

      // Create a default manual account if none exists
      if (accounts.length === 0) {
        const defaultId = generateId();
        await database.runAsync(`
          INSERT INTO trading_accounts (
            id, name, broker, account_number, platform, currency, initial_balance, current_balance, is_connected, is_default, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [defaultId, 'Manual Account', 'Local Broker', '123456', 'manual', 'USD', 10000, 10000, 0, 1]);

        const freshDbAccounts = await database.getAllAsync<DbAccount>(
          'SELECT * FROM trading_accounts ORDER BY is_default DESC, name ASC'
        );
        accounts.push(...freshDbAccounts.map(mapDbAccount));
      }

      // Fetch trades
      const dbTrades = await database.getAllAsync<DbTrade>(
        'SELECT * FROM trades ORDER BY entry_date DESC'
      );
      const trades = dbTrades.map(mapDbTrade);

      // Fetch journals
      const dbJournals = await database.getAllAsync<DbJournal>(
        'SELECT * FROM journal_entries ORDER BY date DESC'
      );
      const journalEntries = dbJournals.map(mapDbJournal);

      set({ accounts, trades, journalEntries, isLoading: false });
    } catch (e) {
      console.error('Failed to init SQLite data:', e);
      set({ error: e instanceof Error ? e.message : 'Unknown error', isLoading: false });
    }
  },

  // ── Account Actions ──

  addAccount: async (account) => {
    const id = generateId();
    try {
      const database = await getDatabase();

      // If this new account is default, make others non-default
      if (account.isDefault) {
        await database.runAsync('UPDATE trading_accounts SET is_default = 0');
      }

      await database.runAsync(`
        INSERT INTO trading_accounts (
          id, name, broker, account_number, platform, currency, initial_balance, current_balance, is_connected, is_default, meta_api_account_id, last_sync_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        id,
        account.name,
        account.broker,
        account.accountNumber,
        account.platform,
        account.currency,
        account.initialBalance,
        account.currentBalance,
        account.isConnected ? 1 : 0,
        account.isDefault ? 1 : 0,
        account.metaApiAccountId,
        account.lastSyncAt,
      ]);

      await get().initData();
      return id;
    } catch (e) {
      console.error('Error adding account:', e);
      throw e;
    }
  },

  updateAccount: async (id, account) => {
    try {
      const database = await getDatabase();

      if (account.isDefault) {
        await database.runAsync('UPDATE trading_accounts SET is_default = 0 WHERE id != ?', [id]);
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (account.name !== undefined) { updates.push('name = ?'); params.push(account.name); }
      if (account.broker !== undefined) { updates.push('broker = ?'); params.push(account.broker); }
      if (account.accountNumber !== undefined) { updates.push('account_number = ?'); params.push(account.accountNumber); }
      if (account.platform !== undefined) { updates.push('platform = ?'); params.push(account.platform); }
      if (account.currency !== undefined) { updates.push('currency = ?'); params.push(account.currency); }
      if (account.initialBalance !== undefined) { updates.push('initial_balance = ?'); params.push(account.initialBalance); }
      if (account.currentBalance !== undefined) { updates.push('current_balance = ?'); params.push(account.currentBalance); }
      if (account.isConnected !== undefined) { updates.push('is_connected = ?'); params.push(account.isConnected ? 1 : 0); }
      if (account.isDefault !== undefined) { updates.push('is_default = ?'); params.push(account.isDefault ? 1 : 0); }
      if (account.metaApiAccountId !== undefined) { updates.push('meta_api_account_id = ?'); params.push(account.metaApiAccountId); }
      if (account.lastSyncAt !== undefined) { updates.push('last_sync_at = ?'); params.push(account.lastSyncAt); }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        params.push(id);
        const sql = `UPDATE trading_accounts SET ${updates.join(', ')} WHERE id = ?`;
        await database.runAsync(sql, params);
        await get().initData();
      }
    } catch (e) {
      console.error('Error updating account:', e);
      throw e;
    }
  },

  deleteAccount: async (id) => {
    try {
      const database = await getDatabase();
      const account = get().accounts.find(a => a.id === id);
      
      // If it is a MetaTrader account connected to MetaApi, delete it from MetaApi as well
      if (account && account.metaApiAccountId) {
        try {
          await deleteAccountFromMetaApi(account.metaApiAccountId);
        } catch (err) {
          console.warn('Failed to delete account from MetaApi:', err);
        }
      }

      await database.runAsync('DELETE FROM trading_accounts WHERE id = ?', [id]);
      await get().initData();
    } catch (e) {
      console.error('Error deleting account:', e);
      throw e;
    }
  },

  setDefaultAccount: async (id) => {
    try {
      const database = await getDatabase();
      await database.runAsync('UPDATE trading_accounts SET is_default = 0');
      await database.runAsync('UPDATE trading_accounts SET is_default = 1 WHERE id = ?', [id]);
      await get().initData();
    } catch (e) {
      console.error('Error setting default account:', e);
      throw e;
    }
  },

  // ── Trade Actions ──

  addTrade: async (trade) => {
    const id = generateId();
    try {
      const database = await getDatabase();
      const screenshotsStr = JSON.stringify(trade.screenshots || []);
      const tagsStr = JSON.stringify(trade.tags || []);

      await database.runAsync(`
        INSERT INTO trades (
          id, instrument, symbol, direction, entry_price, exit_price, stop_loss, take_profit,
          lot_size, leverage, commission, swap, profit_loss, profit_loss_pips, risk_reward_ratio,
          strategy, timeframe, entry_date, exit_date, status, screenshots, notes, tags,
          emotion_entry, emotion_exit, source, external_id, account_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        id,
        trade.instrument,
        trade.symbol,
        trade.direction,
        trade.entryPrice,
        trade.exitPrice,
        trade.stopLoss,
        trade.takeProfit,
        trade.lotSize,
        trade.leverage,
        trade.commission,
        trade.swap,
        trade.profitLoss,
        trade.profitLossPips,
        trade.riskRewardRatio,
        trade.strategy,
        trade.timeframe,
        trade.entryDate,
        trade.exitDate,
        trade.status,
        screenshotsStr,
        trade.notes,
        tagsStr,
        trade.emotionEntry,
        trade.emotionExit,
        trade.source,
        trade.externalId,
        trade.accountId,
      ]);

      // If trade has profit/loss, update the account balance
      if (trade.profitLoss !== null && trade.status === 'closed') {
        await database.runAsync(`
          UPDATE trading_accounts
          SET current_balance = current_balance + ?
          WHERE id = ?
        `, [trade.profitLoss, trade.accountId]);
      }

      await get().initData();
      return id;
    } catch (e) {
      console.error('Error adding trade:', e);
      throw e;
    }
  },

  updateTrade: async (id, trade) => {
    try {
      const database = await getDatabase();

      // Get old trade to calculate balance adjustment
      const oldDbTrade = await database.getFirstAsync<DbTrade>('SELECT * FROM trades WHERE id = ?', [id]);
      const oldTrade = oldDbTrade ? mapDbTrade(oldDbTrade) : null;

      const updates: string[] = [];
      const params: any[] = [];

      if (trade.instrument !== undefined) { updates.push('instrument = ?'); params.push(trade.instrument); }
      if (trade.symbol !== undefined) { updates.push('symbol = ?'); params.push(trade.symbol); }
      if (trade.direction !== undefined) { updates.push('direction = ?'); params.push(trade.direction); }
      if (trade.entryPrice !== undefined) { updates.push('entry_price = ?'); params.push(trade.entryPrice); }
      if (trade.exitPrice !== undefined) { updates.push('exit_price = ?'); params.push(trade.exitPrice); }
      if (trade.stopLoss !== undefined) { updates.push('stop_loss = ?'); params.push(trade.stopLoss); }
      if (trade.takeProfit !== undefined) { updates.push('take_profit = ?'); params.push(trade.takeProfit); }
      if (trade.lotSize !== undefined) { updates.push('lot_size = ?'); params.push(trade.lotSize); }
      if (trade.leverage !== undefined) { updates.push('leverage = ?'); params.push(trade.leverage); }
      if (trade.commission !== undefined) { updates.push('commission = ?'); params.push(trade.commission); }
      if (trade.swap !== undefined) { updates.push('swap = ?'); params.push(trade.swap); }
      if (trade.profitLoss !== undefined) { updates.push('profit_loss = ?'); params.push(trade.profitLoss); }
      if (trade.profitLossPips !== undefined) { updates.push('profit_loss_pips = ?'); params.push(trade.profitLossPips); }
      if (trade.riskRewardRatio !== undefined) { updates.push('risk_reward_ratio = ?'); params.push(trade.riskRewardRatio); }
      if (trade.strategy !== undefined) { updates.push('strategy = ?'); params.push(trade.strategy); }
      if (trade.timeframe !== undefined) { updates.push('timeframe = ?'); params.push(trade.timeframe); }
      if (trade.entryDate !== undefined) { updates.push('entry_date = ?'); params.push(trade.entryDate); }
      if (trade.exitDate !== undefined) { updates.push('exit_date = ?'); params.push(trade.exitDate); }
      if (trade.status !== undefined) { updates.push('status = ?'); params.push(trade.status); }
      if (trade.screenshots !== undefined) { updates.push('screenshots = ?'); params.push(JSON.stringify(trade.screenshots)); }
      if (trade.notes !== undefined) { updates.push('notes = ?'); params.push(trade.notes); }
      if (trade.tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(trade.tags)); }
      if (trade.emotionEntry !== undefined) { updates.push('emotion_entry = ?'); params.push(trade.emotionEntry); }
      if (trade.emotionExit !== undefined) { updates.push('emotion_exit = ?'); params.push(trade.emotionExit); }
      if (trade.source !== undefined) { updates.push('source = ?'); params.push(trade.source); }
      if (trade.externalId !== undefined) { updates.push('external_id = ?'); params.push(trade.externalId); }
      if (trade.accountId !== undefined) { updates.push('account_id = ?'); params.push(trade.accountId); }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        params.push(id);
        const sql = `UPDATE trades SET ${updates.join(', ')} WHERE id = ?`;
        await database.runAsync(sql, params);

        // Adjust account balance based on profitLoss difference
        if (oldTrade) {
          const oldPnL = oldTrade.status === 'closed' ? (oldTrade.profitLoss ?? 0) : 0;
          // Determine new status & profitLoss
          const newStatus = trade.status !== undefined ? trade.status : oldTrade.status;
          const newPnLVal = trade.profitLoss !== undefined ? trade.profitLoss : oldTrade.profitLoss;
          const newPnL = newStatus === 'closed' ? (newPnLVal ?? 0) : 0;

          const diff = newPnL - oldPnL;
          if (diff !== 0) {
            const accId = trade.accountId !== undefined ? trade.accountId : oldTrade.accountId;
            await database.runAsync(`
              UPDATE trading_accounts
              SET current_balance = current_balance + ?
              WHERE id = ?
            `, [diff, accId]);
          }
        }

        await get().initData();
      }
    } catch (e) {
      console.error('Error updating trade:', e);
      throw e;
    }
  },

  deleteTrade: async (id) => {
    try {
      const database = await getDatabase();

      // Adjust account balance (deduct profitLoss) before deleting
      const dbTrade = await database.getFirstAsync<DbTrade>('SELECT * FROM trades WHERE id = ?', [id]);
      if (dbTrade) {
        const trade = mapDbTrade(dbTrade);
        if (trade.status === 'closed' && trade.profitLoss !== null) {
          await database.runAsync(`
            UPDATE trading_accounts
            SET current_balance = current_balance - ?
            WHERE id = ?
          `, [trade.profitLoss, trade.accountId]);
        }
      }

      await database.runAsync('DELETE FROM trades WHERE id = ?', [id]);
      await get().initData();
    } catch (e) {
      console.error('Error deleting trade:', e);
      throw e;
    }
  },

  // ── Journal Actions ──

  addJournalEntry: async (entry) => {
    const id = generateId();
    try {
      const database = await getDatabase();
      const tradeIdsStr = JSON.stringify(entry.tradeIds || []);

      await database.runAsync(`
        INSERT INTO journal_entries (
          id, date, title, content, emotion, market_condition, lessons_learned, goals, trade_ids, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        id,
        entry.date,
        entry.title,
        entry.content,
        entry.emotion,
        entry.marketCondition,
        entry.lessonsLearned,
        entry.goals,
        tradeIdsStr,
      ]);

      await get().initData();
      return id;
    } catch (e) {
      console.error('Error adding journal:', e);
      throw e;
    }
  },

  updateJournalEntry: async (id, entry) => {
    try {
      const database = await getDatabase();
      const updates: string[] = [];
      const params: any[] = [];

      if (entry.date !== undefined) { updates.push('date = ?'); params.push(entry.date); }
      if (entry.title !== undefined) { updates.push('title = ?'); params.push(entry.title); }
      if (entry.content !== undefined) { updates.push('content = ?'); params.push(entry.content); }
      if (entry.emotion !== undefined) { updates.push('emotion = ?'); params.push(entry.emotion); }
      if (entry.marketCondition !== undefined) { updates.push('market_condition = ?'); params.push(entry.marketCondition); }
      if (entry.lessonsLearned !== undefined) { updates.push('lessons_learned = ?'); params.push(entry.lessonsLearned); }
      if (entry.goals !== undefined) { updates.push('goals = ?'); params.push(entry.goals); }
      if (entry.tradeIds !== undefined) { updates.push('trade_ids = ?'); params.push(JSON.stringify(entry.tradeIds)); }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        params.push(id);
        const sql = `UPDATE journal_entries SET ${updates.join(', ')} WHERE id = ?`;
        await database.runAsync(sql, params);
        await get().initData();
      }
    } catch (e) {
      console.error('Error updating journal:', e);
      throw e;
    }
  },

  deleteJournalEntry: async (id) => {
    try {
      const database = await getDatabase();
      await database.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
      await get().initData();
    } catch (e) {
      console.error('Error deleting journal:', e);
      throw e;
    }
  },

  syncMetaApiTrades: async (accountId) => {
    set({ isLoading: true, error: null });
    try {
      const database = await getDatabase();
      const account = get().accounts.find(a => a.id === accountId);
      if (!account || !account.metaApiAccountId) {
        throw new Error('Account does not have a MetaApi account ID connected');
      }

      const metaApiId = account.metaApiAccountId;
      const platform = account.platform === 'mt5' ? 'mt5' : 'mt4';

      // 1. Fetch all accounts from MetaApi and undeploy any other deployed accounts to free up the 1-account limit slot
      try {
        const allMetaAccounts = await listAccounts();
        for (const metaAcc of allMetaAccounts) {
          if (
            metaAcc._id !== metaApiId &&
            (metaAcc.state === 'DEPLOYED' || metaAcc.connectionStatus === 'CONNECTED')
          ) {
            console.log(`Undeploying other account ${metaAcc._id} to free up slot`);
            await undeployAccount(metaAcc._id);
          }
        }
      } catch (err) {
        console.warn('Failed to auto-undeploy other MetaApi accounts:', err);
      }

      // 2. Deploy the current account
      await deployAccount(metaApiId);

      // 2. Fetch history deals from the beginning of 2026
      const startTime = '2026-01-01T00:00:00.000Z';
      const endTime = new Date().toISOString();
      const deals = await getDealHistory(metaApiId, startTime, endTime);

      // 3. Insert deals into database
      for (const deal of deals) {
        // Skip non-trade deals
        if (deal.type !== 'DEAL_TYPE_BUY' && deal.type !== 'DEAL_TYPE_SELL') {
          continue;
        }

        // Check if trade already exists
        const existing = await database.getFirstAsync<{ id: string }>(
          'SELECT id FROM trades WHERE external_id = ?',
          [deal.id]
        );

        if (!existing) {
          const trade = mapDealToTrade(deal, accountId, platform);
          const tradeId = generateId();

          await database.runAsync(`
            INSERT INTO trades (
              id, instrument, symbol, direction, entry_price, exit_price, stop_loss, take_profit,
              lot_size, leverage, commission, swap, profit_loss, profit_loss_pips, risk_reward_ratio,
              strategy, timeframe, entry_date, exit_date, status, screenshots, notes, tags,
              emotion_entry, emotion_exit, source, external_id, account_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `, [
            tradeId,
            trade.instrument,
            trade.symbol,
            trade.direction,
            trade.entryPrice,
            trade.entryPrice,
            null,
            null,
            trade.lotSize,
            null,
            trade.commission,
            trade.swap,
            trade.profitLoss,
            null,
            null,
            '',
            'H1',
            trade.entryDate,
            trade.entryDate,
            'closed',
            '[]',
            trade.notes,
            '[]',
            null,
            null,
            trade.source,
            trade.externalId,
            trade.accountId,
          ]);
        }
      }

      // 4. Fetch latest account info
      const info = await getAccountInfo(metaApiId);

      // 5. Update account balance
      await database.runAsync(`
        UPDATE trading_accounts
        SET current_balance = ?, last_sync_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `, [info.balance, accountId]);

      // 6. Reload
      await get().initData();
    } catch (e) {
      console.error('Failed to sync MetaApi trades:', e);
      set({ error: e instanceof Error ? e.message : 'Sync failed' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  syncSupabaseTrades: async (accountId) => {
    set({ isLoading: true, error: null });
    try {
      const database = await getDatabase();
      const account = get().accounts.find(a => a.id === accountId);
      if (!account) {
        throw new Error('Akun tidak ditemukan');
      }

      if (!account.accountNumber || account.accountNumber === 'Manual') {
        throw new Error('Nomor akun MetaTrader tidak valid untuk sinkronisasi');
      }

      const platform = account.platform === 'mt5' ? 'mt5' : 'mt4';

      // 1. Fetch trades from Supabase
      const sbTrades = await fetchSupabaseTrades(account.accountNumber);

      // 2. Insert trades into SQLite local database
      for (const sbTrade of sbTrades) {
        // Check if trade already exists by external_id (ticket)
        const existing = await database.getFirstAsync<{ id: string }>(
          'SELECT id FROM trades WHERE external_id = ?',
          [String(sbTrade.ticket)]
        );

        if (!existing) {
          const trade = mapSupabaseTradeToLocal(sbTrade, accountId, platform);
          const tradeId = generateId();

          await database.runAsync(`
            INSERT INTO trades (
              id, instrument, symbol, direction, entry_price, exit_price, stop_loss, take_profit,
              lot_size, leverage, commission, swap, profit_loss, profit_loss_pips, risk_reward_ratio,
              strategy, timeframe, entry_date, exit_date, status, screenshots, notes, tags,
              emotion_entry, emotion_exit, source, external_id, account_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `, [
            tradeId,
            trade.instrument,
            trade.symbol,
            trade.direction,
            trade.entryPrice,
            trade.exitPrice,
            trade.stopLoss,
            trade.takeProfit,
            trade.lotSize,
            null,
            trade.commission,
            trade.swap,
            trade.profitLoss,
            null,
            null,
            '',
            'H1',
            trade.entryDate,
            trade.exitDate,
            'closed',
            '[]',
            trade.notes,
            '[]',
            null,
            null,
            trade.source,
            trade.externalId,
            trade.accountId,
          ]);
        }
      }

      // 3. Calculate new current balance from all closed trades + initial balance
      const balanceRow = await database.getFirstAsync<{ net_pnl: number }>(
        'SELECT SUM(profit_loss + commission + swap) as net_pnl FROM trades WHERE account_id = ? AND status = "closed"',
        [accountId]
      );
      const netPnl = balanceRow?.net_pnl || 0;
      const currentBalance = account.initialBalance + netPnl;

      // 4. Update account balance and last sync time
      await database.runAsync(`
        UPDATE trading_accounts
        SET current_balance = ?, last_sync_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `, [currentBalance, accountId]);

      // 5. Reload data in store
      await get().initData();
    } catch (e) {
      console.error('Failed to sync Supabase trades:', e);
      set({ error: e instanceof Error ? e.message : 'Gagal sinkronisasi data dari Supabase' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
}));
