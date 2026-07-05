/**
 * TradeMind — App Store (Zustand)
 * Global app state: theme, settings, sync status
 */

import { create } from 'zustand';
import type { AppSettings, SyncStatus } from '@/src/types/common';
import { DEFAULT_SETTINGS } from '@/src/types/common';
import type { ThemeMode } from '@/src/theme';

interface AppState {
  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Sync
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncAt: (date: string) => void;

  // Onboarding
  isOnboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  // Network
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Theme
  themeMode: 'dark',
  setThemeMode: (mode) => set({ themeMode: mode }),

  // Settings
  settings: DEFAULT_SETTINGS,
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  // Sync
  syncStatus: 'idle',
  lastSyncAt: null,
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),

  // Onboarding
  isOnboardingComplete: false,
  setOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),

  // Network
  isOnline: true,
  setIsOnline: (online) => set({ isOnline: online }),
}));
