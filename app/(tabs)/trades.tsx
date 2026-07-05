/**
 * TradeMind — Trades Screen
 * List of all trades with filters and search
 */

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { formatCurrency, formatDate, formatPrice } from '@/src/utils/formatters';
import { useDataStore } from '@/src/store/useDataStore';
import { useTradeStore } from '@/src/store/useTradeStore';
import type { Trade, TradeStatus } from '@/src/types/trade';

function TradeItem({ trade, currency }: { trade: Trade; currency: string }) {
  const theme = useTheme();
  const isOpen = trade.status === 'open';
  const pnl = trade.profitLoss ?? 0;

  return (
    <Card
      variant="default"
      padding="md"
      style={{ marginBottom: theme.spacing['2'] }}
    >
      {/* Top Row: Symbol + Direction + P&L */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['2'] }}>
            <Text style={{ ...theme.typography.label, color: theme.colors.text }}>
              {trade.symbol}
            </Text>
            <Badge
              text={trade.direction === 'long' ? 'BUY' : 'SELL'}
              variant={trade.direction === 'long' ? 'long' : 'short'}
            />
            {isOpen && <Badge text="OPEN" variant="primary" />}
          </View>

          {/* Details */}
          <View style={{ flexDirection: 'row', gap: theme.spacing['4'], marginTop: theme.spacing['2'] }}>
            <View>
              <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                Entry
              </Text>
              <Text style={{ ...theme.typography.numberSmall, color: theme.colors.text }}>
                {formatPrice(trade.entryPrice, trade.symbol)}
              </Text>
            </View>
            <View>
              <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                Exit
              </Text>
              <Text style={{ ...theme.typography.numberSmall, color: theme.colors.text }}>
                {trade.exitPrice ? formatPrice(trade.exitPrice, trade.symbol) : '—'}
              </Text>
            </View>
            <View>
              <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                Lot
              </Text>
              <Text style={{ ...theme.typography.numberSmall, color: theme.colors.text }}>
                {trade.lotSize}
              </Text>
            </View>
          </View>
        </View>

        {/* P&L */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              ...theme.typography.number,
              color: isOpen
                ? theme.colors.textSecondary
                : pnl >= 0
                  ? theme.colors.profit
                  : theme.colors.loss,
              fontSize: 16,
            }}
          >
            {isOpen ? '—' : formatCurrency(pnl, currency)}
          </Text>
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.textTertiary,
              marginTop: 2,
            }}
          >
            {formatDate(trade.entryDate, 'short')}
          </Text>
        </View>
      </View>

      {/* Bottom Row: Strategy + Timeframe + Emotion */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing['3'],
          paddingTop: theme.spacing['3'],
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderSubtle,
        }}
      >
        <View style={{ flexDirection: 'row', gap: theme.spacing['2'] }}>
          {trade.strategy ? <Badge text={trade.strategy} variant="neutral" /> : null}
          <Badge text={trade.timeframe} variant="neutral" />
        </View>
        {trade.emotionEntry && (
          <Text style={{ fontSize: 16 }}>
            {trade.emotionEntry === 1 ? '😰' : trade.emotionEntry === 2 ? '😟' : trade.emotionEntry === 3 ? '😐' : trade.emotionEntry === 4 ? '😊' : '🔥'}
          </Text>
        )}
      </View>
    </Card>
  );
}

export default function TradesScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { initData, trades, accounts, isLoading } = useDataStore();
  const { activeAccountId, setActiveAccountId } = useTradeStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    initData();
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];
  const activeCurrency = activeAccount?.currency || 'USD';

  // Filter trades
  const filteredTrades = trades.filter((trade) => {
    // Check account
    if (trade.accountId !== activeAccount?.id) return false;

    // Check status filter
    if (statusFilter === 'open' && trade.status !== 'open') return false;
    if (statusFilter === 'closed' && trade.status !== 'closed') return false;

    // Check search query (symbol, notes, strategy)
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        trade.symbol.toLowerCase().includes(q) ||
        (trade.strategy && trade.strategy.toLowerCase().includes(q)) ||
        (trade.notes && trade.notes.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <Screen scrollable={false} padding={false} loading={isLoading && trades.length === 0}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: theme.dimensions.screenPadding,
          paddingTop: theme.spacing['4'],
          paddingBottom: theme.spacing['3'],
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ ...theme.typography.h1, color: theme.colors.text }}>
            Trades
          </Text>
          <Button
            title="+ Add Trade"
            onPress={() => router.push('/add-trade' as any)}
            variant="outline"
            size="sm"
          />
        </View>
        <Text
          style={{
            ...theme.typography.bodySmall,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing['1'],
          }}
        >
          {filteredTrades.length} transaksi ditampilkan
        </Text>
      </View>

      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: theme.dimensions.screenPadding,
          marginBottom: theme.spacing['3'],
        }}
      >
        <Input
          placeholder="Cari simbol, strategi, atau catatan..."
          value={search}
          onChangeText={setSearch}
          size="sm"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'open', 'closed'] as const).map((filter) => {
          const isActive = statusFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setStatusFilter(filter)}
              style={[
                styles.filterTab,
                { backgroundColor: theme.colors.backgroundTertiary },
                isActive && { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  theme.typography.labelSmall,
                  { color: theme.colors.textSecondary },
                  isActive && { color: '#FFFFFF', fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                {filter === 'all' ? 'SEMUA' : filter === 'open' ? 'TERBUKA' : 'TERTUTUP'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Trade List */}
      <FlatList
        data={filteredTrades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TradeItem trade={item} currency={activeCurrency} />}
        contentContainerStyle={{
          paddingHorizontal: theme.dimensions.screenPadding,
          paddingTop: theme.spacing['2'],
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Card variant="default" padding="lg" style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
              Tidak ada transaksi ditemukan
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 4 }}>
              Coba ubah kata kunci pencarian atau status filter
            </Text>
          </Card>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
