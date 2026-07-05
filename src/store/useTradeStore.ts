/**
 * TradeMind — Trade Store (Zustand)
 * Local state for active trades, filters, and form state
 */

import { create } from 'zustand';
import type { Trade, Instrument, TradeStatus, Timeframe, TradeFormData } from '@/src/types/trade';
import type { DateRange, DatePreset, SortConfig } from '@/src/types/common';

// ── Filter State ──
interface TradeFilters {
  instruments: Instrument[];
  statuses: TradeStatus[];
  symbols: string[];
  strategies: string[];
  timeframes: Timeframe[];
  datePreset: DatePreset;
  customDateRange: DateRange | null;
  tags: string[];
  searchQuery: string;
  minProfitLoss: number | null;
  maxProfitLoss: number | null;
}

const DEFAULT_FILTERS: TradeFilters = {
  instruments: [],
  statuses: [],
  symbols: [],
  strategies: [],
  timeframes: [],
  datePreset: 'this_month',
  customDateRange: null,
  tags: [],
  searchQuery: '',
  minProfitLoss: null,
  maxProfitLoss: null,
};

// ── Trade Store ──
interface TradeState {
  // Current selected trade
  selectedTradeId: string | null;
  setSelectedTradeId: (id: string | null) => void;

  // Filters
  filters: TradeFilters;
  setFilters: (filters: Partial<TradeFilters>) => void;
  resetFilters: () => void;

  // Sort
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;

  // Active account
  activeAccountId: string | null;
  setActiveAccountId: (id: string | null) => void;

  // Trade form
  isFormOpen: boolean;
  setFormOpen: (open: boolean) => void;
  editingTradeId: string | null;
  setEditingTradeId: (id: string | null) => void;

  // View mode
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  // Selected trade
  selectedTradeId: null,
  setSelectedTradeId: (id) => set({ selectedTradeId: id }),

  // Filters
  filters: DEFAULT_FILTERS,
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  // Sort
  sortConfig: { field: 'entryDate', direction: 'desc' },
  setSortConfig: (config) => set({ sortConfig: config }),

  // Active account
  activeAccountId: null,
  setActiveAccountId: (id) => set({ activeAccountId: id }),

  // Form
  isFormOpen: false,
  setFormOpen: (open) => set({ isFormOpen: open }),
  editingTradeId: null,
  setEditingTradeId: (id) => set({ editingTradeId: id }),

  // View
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
}));
