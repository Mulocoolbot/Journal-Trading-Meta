/**
 * TradeMind — Manage Accounts Screen
 * Lets the user create manual accounts, setup Supabase Sync for MetaTrader,
 * set the default active account, and trigger history synchronization.
 */

const SUPABASE_TABLE_SQL = `create table mt_sync_trades (
  id bigint primary key generated always as identity,
  ticket bigint not null unique,
  account_number text not null,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  entry_price double precision not null,
  exit_price double precision not null,
  stop_loss double precision,
  take_profit double precision,
  lot_size double precision not null,
  commission double precision not null default 0,
  swap double precision not null default 0,
  profit_loss double precision not null,
  entry_date timestamp with time zone not null,
  exit_date timestamp with time zone not null,
  comment text,
  source text not null default 'ea_mt',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_mt_sync_trades_account on mt_sync_trades(account_number);`;

const MQL5_EA_CODE = `//+------------------------------------------------------------------+
//|                                             TradeMindSync.mq5    |
//|                                  Copyright 2026, TradeMind       |
//|                                             https://trademind.io |
//+------------------------------------------------------------------+
#property copyright "TradeMind"
#property link      "https://trademind.io"
#property version   "1.00"

input string   SupabaseUrl      = "https://your-project.supabase.co";
input string   SupabaseAnonKey  = "your-anon-key";
input int      SyncIntervalSec  = 30;

datetime last_sync_time = 0;
string full_api_url = "";

int OnInit()
{
   full_api_url = SupabaseUrl + "/rest/v1/mt_sync_trades?on_conflict=ticket";
   last_sync_time = TimeCurrent() - 7 * 24 * 3600;
   EventSetTimer(SyncIntervalSec);
   SyncClosedTrades();
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) { EventKillTimer(); }
void OnTimer() { SyncClosedTrades(); }
void OnTrade() { SyncClosedTrades(); }

void SyncClosedTrades()
{
   if(!HistorySelect(last_sync_time, TimeCurrent())) return;
   int total_deals = HistoryDealsTotal();
   string account_num = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   string json_payload = "[";
   int added_count = 0;

   for(int i = 0; i < total_deals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket <= 0) continue;
      long entry_type = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long deal_type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      
      if(entry_type == DEAL_ENTRY_OUT || entry_type == DEAL_ENTRY_INOUT)
      {
         if(deal_type != DEAL_TYPE_BUY && deal_type != DEAL_TYPE_SELL) continue;
         string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
         double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
         double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
         double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
         double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
         double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
         
         ulong position_id = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
         double entry_price = 0;
         datetime entry_time = 0;
         
         if(HistorySelectByPosition(position_id))
         {
            int pos_deals = HistoryDealsTotal();
            for(int j = 0; j < pos_deals; j++)
            {
               ulong p_ticket = HistoryDealGetTicket(j);
               if(HistoryDealGetInteger(p_ticket, DEAL_ENTRY) == DEAL_ENTRY_IN)
               {
                  entry_price = HistoryDealGetDouble(p_ticket, DEAL_PRICE);
                  entry_time = (datetime)HistoryDealGetInteger(p_ticket, DEAL_TIME);
                  break;
               }
            }
         }
         datetime exit_time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         string direction = (deal_type == DEAL_TYPE_BUY) ? "short" : "long";
         
         string trade_json = StringFormat(
            "{\\"ticket\\":%d,\\"account_number\\":\\"%s\\",\\"symbol\\":\\"%s\\",\\"direction\\":\\"%s\\",\\"entry_price\\":%f,\\"exit_price\\":%f,\\"lot_size\\":%f,\\"commission\\":%f,\\"swap\\":%f,\\"profit_loss\\":%f,\\"entry_date\\":\\"%s\\",\\"exit_date\\":\\"%s\\",\\"comment\\":\\"%s\\"}",
            ticket, account_num, symbol, direction, entry_price, price, volume, commission, swap, profit, 
            TimeToStringISO(entry_time), TimeToStringISO(exit_time), "EA MT5 Sync"
         );
         if(added_count > 0) json_payload += ",";
         json_payload += trade_json;
         added_count++;
      }
   }
   json_payload += "]";
   if(added_count > 0)
   {
      SendToSupabase(json_payload);
      last_sync_time = TimeCurrent() - 60;
   }
}

void SendToSupabase(string json_data)
{
   char data[];
   char result[];
   string response_headers;
   StringToCharArray(json_data, data, 0, WHOLE_ARRAY, CP_UTF8);
   string headers = "Content-Type: application/json\\r\\napikey: " + SupabaseAnonKey + "\\r\\nAuthorization: Bearer " + SupabaseAnonKey + "\\r\\nPrefer: resolution=merge-duplicates\\r\\n";
   WebRequest("POST", full_api_url, headers, 5000, data, result, response_headers);
}

string TimeToStringISO(datetime time)
{
   MqlDateTime dt;
   TimeToStruct(time, dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ", dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
}`;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/theme';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useDataStore } from '@/src/store/useDataStore';
import { useTradeStore } from '@/src/store/useTradeStore';
import { listAccounts, provisionAccount, deleteAccount as deleteAccountFromMetaApi, MetaApiAccount } from '@/src/features/metatrader/services/metaApiService';
import { getSupabaseConfig, saveSupabaseConfig } from '@/src/features/metatrader/services/supabaseSyncService';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

export default function ManageAccountsModal() {
  const theme = useTheme();
  const router = useRouter();

  // Zustand Store
  const {
    accounts,
    addAccount,
    deleteAccount,
    setDefaultAccount,
    syncMetaApiTrades,
    syncSupabaseTrades,
    isLoading: isStoreLoading,
  } = useDataStore();

  const { activeAccountId, setActiveAccountId } = useTradeStore();

  // Local UI States
  const [activeTab, setActiveTab] = useState<'list' | 'add-manual' | 'metaapi'>('list');
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Manual Account Form State
  const [manualName, setManualName] = useState('');
  const [manualBroker, setManualBroker] = useState('');
  const [manualBalance, setManualBalance] = useState('10000');
  const [manualCurrency, setManualCurrency] = useState<'USD' | 'EUR' | 'IDR'>('USD');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Supabase Sync Configuration State
  const [sbUrl, setSbUrl] = useState('');
  const [sbAnonKey, setSbAnonKey] = useState('');

  // Direct MetaTrader Account Form State
  const [mtName, setMtName] = useState('');
  const [mtLogin, setMtLogin] = useState('');
  const [mtServer, setMtServer] = useState('');
  const [mtPlatform, setMtPlatform] = useState<'mt4' | 'mt5'>('mt4');
  const [mtCurrency, setMtCurrency] = useState<'USD' | 'EUR' | 'IDR'>('USD');
  const [mtBalance, setMtBalance] = useState('10000');
  const [isSubmittingMT, setIsSubmittingMT] = useState(false);

  // Load Supabase settings on mount
  useEffect(() => {
    const loadSupabaseSettings = async () => {
      try {
        const config = await getSupabaseConfig();
        setSbUrl(config.url);
        setSbAnonKey(config.anonKey);
      } catch (err) {
        console.warn('Gagal memuat konfigurasi Supabase:', err);
      }
    };
    loadSupabaseSettings();
  }, []);

  // Handle setting active/default account
  const handleSetActiveAccount = async (id: string) => {
    try {
      setActiveAccountId(id);
      await setDefaultAccount(id);
    } catch (err) {
      Alert.alert('Gagal', 'Gagal mengganti akun aktif.');
    }
  };

  // Handle adding manual account
  const handleAddManualAccount = async () => {
    if (!manualName.trim()) {
      Alert.alert('Validasi', 'Nama akun tidak boleh kosong.');
      return;
    }

    const balanceNum = parseFloat(manualBalance);
    if (isNaN(balanceNum)) {
      Alert.alert('Validasi', 'Saldo awal harus berupa angka yang valid.');
      return;
    }

    setIsSubmittingManual(true);
    try {
      const newId = await addAccount({
        name: manualName,
        broker: manualBroker.trim() || 'Manual Broker',
        accountNumber: 'Manual',
        platform: 'manual',
        currency: manualCurrency,
        initialBalance: balanceNum,
        currentBalance: balanceNum,
        isConnected: false,
        isDefault: accounts.length === 0,
        metaApiAccountId: null,
        lastSyncAt: null,
      });

      // If first account, set active
      if (accounts.length === 0) {
        setActiveAccountId(newId);
      }

      Alert.alert('Sukses', 'Akun manual berhasil ditambahkan!');
      setManualName('');
      setManualBroker('');
      setManualBalance('10000');
      setActiveTab('list');
    } catch (err) {
      Alert.alert('Error', 'Gagal menyimpan akun baru.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Handle direct connection of MetaTrader account via Supabase
  const handleConnectMetaTraderAccount = async () => {
    if (!sbUrl.trim() || !sbAnonKey.trim()) {
      Alert.alert('Validasi', 'Supabase URL dan Anon Key harus diisi untuk menggunakan fitur Auto Sync.');
      return;
    }

    if (!mtName.trim() || !mtLogin.trim()) {
      Alert.alert('Validasi', 'Nama akun dan nomor login ID (nomor akun) harus diisi.');
      return;
    }

    const balanceNum = parseFloat(mtBalance);
    if (isNaN(balanceNum)) {
      Alert.alert('Validasi', 'Saldo awal harus berupa angka yang valid.');
      return;
    }

    setIsSubmittingMT(true);
    try {
      // 1. Simpan konfigurasi Supabase ke AsyncStorage
      await saveSupabaseConfig(sbUrl, sbAnonKey);

      // 2. Tambahkan akun ke database SQLite lokal
      const localId = await addAccount({
        name: mtName,
        broker: mtServer.trim() || 'MetaTrader Broker',
        accountNumber: mtLogin,
        platform: mtPlatform,
        currency: mtCurrency,
        initialBalance: balanceNum,
        currentBalance: balanceNum,
        isConnected: true,
        isDefault: accounts.length === 0,
        metaApiAccountId: null, // Menggunakan Supabase, bukan MetaApi
        lastSyncAt: null,
      });

      if (accounts.length === 0) {
        setActiveAccountId(localId);
      }

      // 3. Clear form
      setMtName('');
      setMtLogin('');
      setMtServer('');
      setMtBalance('10000');

      Alert.alert(
        'Sukses Terhubung',
        'Akun MetaTrader berhasil disimpan! Langkah selanjutnya adalah memasang EA di MetaTrader laptop Anda untuk mendeteksi transaksi secara otomatis.',
        [
          {
            text: 'Mulai Sync Pertama',
            onPress: () => {
              handleSyncAccount(localId);
            }
          },
          { text: 'Nanti Saja', style: 'cancel' }
        ]
      );

      setActiveTab('list');
    } catch (err) {
      Alert.alert('Error', 'Gagal menghubungkan akun MetaTrader: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingMT(false);
    }
  };

  // Handle Sync Action
  const handleSyncAccount = async (id: string) => {
    setSyncingAccountId(id);
    const account = accounts.find(a => a.id === id);
    try {
      if (account?.metaApiAccountId) {
        await syncMetaApiTrades(id);
      } else {
        await syncSupabaseTrades(id);
      }
      Alert.alert('Sinkronisasi Sukses', 'Riwayat transaksi berhasil diperbarui dengan data MetaTrader terbaru!');
    } catch (err) {
      Alert.alert('Gagal Sinkronisasi', err instanceof Error ? err.message : 'Terjadi kesalahan saat menarik transaksi.');
    } finally {
      setSyncingAccountId(null);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = (id: string, name: string) => {
    // Prevent deletion if it's the only account left
    if (accounts.length <= 1) {
      Alert.alert('Perhatian', 'Anda tidak dapat menghapus akun terakhir Anda. Buat akun baru terlebih dahulu.');
      return;
    }

    Alert.alert(
      'Hapus Akun',
      `Apakah Anda yakin ingin menghapus akun "${name}"? Semua data transaksi lokal terkait akun ini juga akan dihapus. Jika terhubung ke MetaTrader, akun juga akan dihapus dari server MetaApi.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              // If we are deleting the active account, switch active account to another one first
              if (id === activeAccountId) {
                const remaining = accounts.find(a => a.id !== id);
                if (remaining) {
                  setActiveAccountId(remaining.id);
                  await setDefaultAccount(remaining.id);
                }
              }
              await deleteAccount(id);
              Alert.alert('Sukses', 'Akun berhasil dihapus.');
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus akun: ' + (err instanceof Error ? err.message : String(err)));
            }
          }
        }
      ]
    );
  };



  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.borderSubtle }]}>
        <Pressable
          style={[styles.tabItem, activeTab === 'list' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'list' ? theme.colors.text : theme.colors.textSecondary }]}>
            Daftar Akun
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'add-manual' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('add-manual')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'add-manual' ? theme.colors.text : theme.colors.textSecondary }]}>
            Akun Manual
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'metaapi' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('metaapi')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'metaapi' ? theme.colors.text : theme.colors.textSecondary }]}>
            Auto Sync (EA)
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* LIST TAB */}
        {activeTab === 'list' && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold }]}>
              AKUN ANDA
            </Text>

            {accounts.length === 0 ? (
              <Card variant="glass" padding="md" style={styles.emptyCard}>
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                  Belum ada akun trading. Tambahkan akun manual atau hubungkan MetaTrader.
                </Text>
              </Card>
            ) : (
              accounts.map((item) => {
                const isActive = item.id === activeAccountId;
                const isSyncing = syncingAccountId === item.id;
                const isMetaTrader = item.platform === 'mt4' || item.platform === 'mt5';

                return (
                  <Card key={item.id} variant="glass" padding="md" style={styles.accountCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.accountName, { color: theme.colors.text, fontFamily: theme.fontFamily.bold }]}>
                            {item.name}
                          </Text>
                          {isActive && <Badge text="Aktif" variant="profit" />}
                        </View>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>
                          {item.broker} {item.accountNumber !== 'Manual' ? `(${item.accountNumber})` : ''}
                        </Text>
                      </View>
                      <Badge
                        text={item.platform.toUpperCase()}
                        variant={item.platform === 'manual' ? 'neutral' : 'primary'}
                      />
                    </View>

                    <View style={styles.cardBody}>
                      <View>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Saldo Saat Ini</Text>
                        <Text style={[styles.balanceText, { color: theme.colors.text, fontFamily: theme.fontFamily.bold }]}>
                          {formatCurrency(item.currentBalance, item.currency, false)}
                        </Text>
                      </View>

                      {item.lastSyncAt && (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: theme.colors.textTertiary, fontSize: 10 }}>Sync Terakhir</Text>
                          <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>
                            {formatDate(item.lastSyncAt, 'datetime')}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardActions}>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        {!isActive ? (
                          <Button
                            title="Set Aktif"
                            variant="outline"
                            size="sm"
                            onPress={() => handleSetActiveAccount(item.id)}
                          />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 }}>
                            <Ionicons name="checkmark-circle" color={theme.colors.profit} size={16} />
                            <Text style={{ color: theme.colors.profit, fontSize: 12, fontFamily: theme.fontFamily.semiBold }}>
                              Akun Utama
                            </Text>
                          </View>
                        )}
                        {isMetaTrader && (
                          <Button
                            title={isSyncing ? "Syncing..." : "Sync"}
                            variant="primary"
                            size="sm"
                            loading={isSyncing}
                            onPress={() => handleSyncAccount(item.id)}
                            icon={<Ionicons name="sync-outline" color="#fff" size={14} />}
                          />
                        )}
                      </View>
                      <Button
                        title="Hapus"
                        variant="danger"
                        size="sm"
                        onPress={() => handleDeleteAccount(item.id, item.name)}
                        icon={<Ionicons name="trash-outline" color="#fff" size={14} />}
                      />
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ADD MANUAL TAB */}
        {activeTab === 'add-manual' && (
          <Card variant="glass" padding="lg">
            <Text style={[styles.formTitle, { color: theme.colors.text, fontFamily: theme.fontFamily.bold }]}>
              Buat Akun Manual Baru
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
              Catat riwayat trading secara manual untuk akun demo atau live Anda.
            </Text>

            <Input
              label="Nama Akun"
              placeholder="Contoh: Akun Demo Personal"
              value={manualName}
              onChangeText={setManualName}
            />

            <Input
              label="Broker"
              placeholder="Contoh: IC Markets, Exness"
              value={manualBroker}
              onChangeText={setManualBroker}
            />

            <Input
              label="Saldo Awal"
              placeholder="10000"
              keyboardType="numeric"
              value={manualBalance}
              onChangeText={setManualBalance}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.medium }]}>
              Mata Uang
            </Text>
            <View style={styles.currencySelect}>
              {(['USD', 'EUR', 'IDR'] as const).map((curr) => {
                const isSelected = manualCurrency === curr;
                return (
                  <Pressable
                    key={curr}
                    style={[
                      styles.currencyOption,
                      { borderColor: theme.colors.border },
                      isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    ]}
                    onPress={() => setManualCurrency(curr)}
                  >
                    <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: 'bold' }}>
                      {curr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ marginTop: 24 }}>
              <Button
                title="Buat Akun"
                variant="primary"
                loading={isSubmittingManual}
                onPress={handleAddManualAccount}
                fullWidth
              />
            </View>
          </Card>
        )}

        {/* METATRADER INTEGRATION TAB */}
        {activeTab === 'metaapi' && (
          <View>
            {/* Form Konfigurasi Supabase */}
            <Card variant="glass" padding="lg" style={{ marginBottom: 24 }}>
              <Text style={[styles.formTitle, { color: theme.colors.text, fontFamily: theme.fontFamily.bold }]}>
                1. Konfigurasi Supabase Cloud
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
                Masukkan URL & Anon Key project Supabase Anda. Konfigurasi ini disimpan dengan aman di HP Anda.
              </Text>

              <Input
                label="Supabase URL"
                placeholder="https://xxx.supabase.co"
                value={sbUrl}
                onChangeText={setSbUrl}
              />

              <Input
                label="Supabase Anon Key"
                placeholder="Masukkan anon key Supabase Anda"
                value={sbAnonKey}
                onChangeText={setSbAnonKey}
              />
            </Card>

            {/* Form Tambah Akun MetaTrader */}
            <Card variant="glass" padding="lg" style={{ marginBottom: 24 }}>
              <Text style={[styles.formTitle, { color: theme.colors.text, fontFamily: theme.fontFamily.bold }]}>
                2. Hubungkan Akun MetaTrader
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
                Daftarkan akun MetaTrader Anda. Pastikan Nomor Akun persis seperti yang digunakan di EA MetaTrader laptop.
              </Text>

              <Input
                label="Nama Akun di Aplikasi"
                placeholder="Contoh: Akun Demo MT5"
                value={mtName}
                onChangeText={setMtName}
              />

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.medium, marginTop: 0 }]}>
                    Platform
                  </Text>
                  <View style={styles.currencySelect}>
                    {(['mt4', 'mt5'] as const).map((p) => {
                      const isSelected = mtPlatform === p;
                      return (
                        <Pressable
                          key={p}
                          style={[
                            styles.currencyOption,
                            { borderColor: theme.colors.border },
                            isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                          ]}
                          onPress={() => setMtPlatform(p)}
                        >
                          <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: 'bold' }}>
                            {p.toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.medium, marginTop: 0 }]}>
                    Mata Uang
                  </Text>
                  <View style={styles.currencySelect}>
                    {(['USD', 'EUR', 'IDR'] as const).map((curr) => {
                      const isSelected = mtCurrency === curr;
                      return (
                        <Pressable
                          key={curr}
                          style={[
                            styles.currencyOption,
                            { borderColor: theme.colors.border },
                            isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                          ]}
                          onPress={() => setMtCurrency(curr)}
                        >
                          <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: 'bold' }}>
                            {curr}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              <Input
                label="Login ID (Nomor Akun MetaTrader)"
                placeholder="Contoh: 12345678"
                keyboardType="numeric"
                value={mtLogin}
                onChangeText={setMtLogin}
              />

              <Input
                label="Broker / Server Name"
                placeholder="Contoh: IC Markets"
                value={mtServer}
                onChangeText={setMtServer}
              />

              <Input
                label="Saldo Awal Akun (Initial Balance)"
                placeholder="10000"
                keyboardType="numeric"
                value={mtBalance}
                onChangeText={setMtBalance}
              />

              <View style={{ marginTop: 20 }}>
                <Button
                  title="Hubungkan & Simpan Akun"
                  variant="primary"
                  loading={isSubmittingMT}
                  onPress={handleConnectMetaTraderAccount}
                  fullWidth
                />
              </View>
            </Card>

            {/* Panduan Instalasi EA MQL */}
            <Card variant="glass" padding="lg" style={{ marginBottom: 24 }}>
              <Text style={[styles.formTitle, { color: theme.colors.text, fontFamily: theme.fontFamily.bold, marginBottom: 8 }]}>
                3. Panduan Pemasangan EA (Expert Advisor)
              </Text>
              
              <Text style={{ color: theme.colors.text, fontFamily: theme.fontFamily.bold, fontSize: 14, marginTop: 8 }}>
                Langkah A: Buat Tabel di Supabase
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                Buka SQL Editor di dasbor Supabase Anda, lalu jalankan query SQL berikut untuk membuat tabel transaksi:
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: '#8ab4f8',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  padding: 10,
                  borderRadius: 8,
                  height: 120,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSubtle
                }}
                multiline
                editable={false}
                selectTextOnFocus
                value={SUPABASE_TABLE_SQL}
              />

              <Text style={{ color: theme.colors.text, fontFamily: theme.fontFamily.bold, fontSize: 14, marginTop: 16 }}>
                Langkah B: Salin & Pasang EA di Laptop Anda
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                Buka MetaEditor di MetaTrader laptop Anda, buat Expert Advisor baru bernama "TradeMindSync", lalu salin seluruh kode di bawah ini:
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: '#8ab4f8',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  padding: 10,
                  borderRadius: 8,
                  height: 150,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSubtle
                }}
                multiline
                editable={false}
                selectTextOnFocus
                value={MQL5_EA_CODE}
              />

              <Text style={{ color: theme.colors.text, fontFamily: theme.fontFamily.bold, fontSize: 14, marginTop: 16 }}>
                Langkah C: Konfigurasi MQL WebRequest
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
                Di terminal MetaTrader laptop Anda, buka:
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontStyle: 'italic', marginBottom: 8 }}>
                Tools &rarr; Options &rarr; Expert Advisors
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                Centang "Allow WebRequest for listed URL" dan tambahkan URL Supabase Anda (contoh: https://xxx.supabase.co).
              </Text>

              <Text style={{ color: theme.colors.text, fontFamily: theme.fontFamily.bold, fontSize: 14, marginTop: 16 }}>
                Langkah D: Jalankan EA
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                Tarik EA "TradeMindSync" ke salah satu chart di laptop Anda. Masukkan URL Supabase dan Anon Key Anda di tab Input parameter EA. Tekan OK dan pastikan status EA aktif!
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  accountCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accountName: {
    fontSize: 16,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceText: {
    fontSize: 18,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    marginTop: 4,
  },
  formTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    marginTop: 12,
    marginBottom: 6,
  },
  currencySelect: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyOption: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  errorCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
