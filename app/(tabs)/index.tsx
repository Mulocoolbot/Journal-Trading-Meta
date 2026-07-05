/**
 * TradeMind — Dashboard Screen
 * Overview of trading performance with P&L, win rate, and recent trades
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { formatCurrency, formatPercentage, formatDate } from '@/src/utils/formatters';
import { useDataStore } from '@/src/store/useDataStore';
import { useTradeStore } from '@/src/store/useTradeStore';
import { calculateTradeStats } from '@/src/utils/calculations';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { initData, trades, accounts, isLoading } = useDataStore();
  const { activeAccountId, setActiveAccountId } = useTradeStore();

  useEffect(() => {
    initData();
  }, []);

  // Set default active account if not set
  useEffect(() => {
    if (!activeAccountId && accounts.length > 0) {
      const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
      setActiveAccountId(defaultAcc.id);
    }
  }, [accounts, activeAccountId]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];
  const activeAccountTrades = trades.filter((t) => t.accountId === activeAccount?.id);

  // Calculate real-time stats
  const stats = calculateTradeStats(activeAccountTrades);

  // Open trades count
  const openTradesCount = activeAccountTrades.filter((t) => t.status === 'open').length;

  // Best symbol
  const symbolPnL: Record<string, number> = {};
  activeAccountTrades.forEach((t) => {
    if (t.status === 'closed' && t.profitLoss !== null) {
      symbolPnL[t.symbol] = (symbolPnL[t.symbol] || 0) + t.profitLoss;
    }
  });
  let bestSymbol = '—';
  let maxSymbolPnL = -Infinity;
  Object.keys(symbolPnL).forEach((symbol) => {
    if (symbolPnL[symbol] > maxSymbolPnL) {
      maxSymbolPnL = symbolPnL[symbol];
      bestSymbol = symbol;
    }
  });

  // Today's P&L
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPL = activeAccountTrades
    .filter((t) => {
      const dateKey = t.exitDate ? t.exitDate.split('T')[0] : t.entryDate.split('T')[0];
      return dateKey === todayStr && t.status === 'closed' && t.profitLoss !== null;
    })
    .reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);

  // Recent Trades (max 5)
  const recentTrades = activeAccountTrades.slice(0, 5);

  return (
    <Screen loading={isLoading && accounts.length === 0}>
      {/* Header */}
      <View style={{ paddingTop: theme.spacing['4'], marginBottom: theme.spacing['4'] }}>
        <Text
          style={{
            ...theme.typography.overline,
            color: theme.colors.textTertiary,
            marginBottom: theme.spacing['1'],
          }}
        >
          TRADEMIND
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              ...theme.typography.h1,
              color: theme.colors.text,
            }}
          >
            Dashboard
          </Text>
          {activeAccount && (
            <Pressable onPress={() => router.push('/manage-accounts' as any)}>
              <Badge text={`${activeAccount.name} (${activeAccount.currency})`} variant="neutral" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Account Balance / Total P&L Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: theme.spacing['4'] }}>
        <Text
          style={{
            ...theme.typography.labelSmall,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing['1'],
          }}
        >
          Account Balance
        </Text>
        <Text
          style={{
            ...theme.typography.displayMedium,
            color: theme.colors.text,
          }}
        >
          {formatCurrency(activeAccount?.currentBalance ?? 0, activeAccount?.currency || 'USD', false)}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing['4'],
            marginTop: theme.spacing['3'],
            paddingTop: theme.spacing['3'],
            borderTopWidth: 1,
            borderTopColor: theme.colors.borderSubtle,
          }}
        >
          <View>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
              Total Profit/Loss
            </Text>
            <Text
              style={{
                ...theme.typography.numberSmall,
                color: stats.totalProfitLoss >= 0 ? theme.colors.profit : theme.colors.loss,
              }}
            >
              {formatCurrency(stats.totalProfitLoss, activeAccount?.currency || 'USD')}
            </Text>
          </View>
          <View>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
              P&L Hari Ini
            </Text>
            <Text
              style={{
                ...theme.typography.numberSmall,
                color: todayPL >= 0 ? theme.colors.profit : theme.colors.loss,
              }}
            >
              {formatCurrency(todayPL, activeAccount?.currency || 'USD')}
            </Text>
          </View>
        </View>
      </Card>

      {/* Stats Grid */}
      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing['3'],
          marginBottom: theme.spacing['4'],
        }}
      >
        {/* Win Rate */}
        <Card variant="default" padding="md" style={{ flex: 1 }}>
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.textTertiary,
              marginBottom: theme.spacing['1'],
            }}
          >
            Win Rate
          </Text>
          <Text
            style={{
              ...theme.typography.numberLarge,
              color: theme.colors.profit,
              fontSize: 28,
            }}
          >
            {stats.winRate}%
          </Text>
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.textTertiary,
              marginTop: theme.spacing['0.5'],
            }}
          >
            {stats.totalTrades} transaksi
          </Text>
        </Card>

        {/* Open Trades */}
        <Card variant="default" padding="md" style={{ flex: 1 }}>
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.textTertiary,
              marginBottom: theme.spacing['1'],
            }}
          >
            Open Trades
          </Text>
          <Text
            style={{
              ...theme.typography.numberLarge,
              color: theme.colors.accent,
              fontSize: 28,
            }}
          >
            {openTradesCount}
          </Text>
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.textTertiary,
              marginTop: theme.spacing['0.5'],
            }}
          >
            Terbaik: {bestSymbol}
          </Text>
        </Card>
      </View>

      {/* Recent Trades */}
      <View style={{ marginBottom: theme.spacing['4'] }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing['3'],
          }}
        >
          <Text style={{ ...theme.typography.h3, color: theme.colors.text }}>
            Recent Trades
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/trades')}>
            <Text style={{ ...theme.typography.labelSmall, color: theme.colors.primary }}>
              View All
            </Text>
          </Pressable>
        </View>

        {recentTrades.length === 0 ? (
          <Card variant="default" padding="lg" style={{ alignItems: 'center' }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
              Belum ada riwayat transaksi
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 4 }}>
              Mulai dengan menambahkan transaksi baru di tab Trades
            </Text>
          </Card>
        ) : (
          recentTrades.map((trade) => {
            const isOpen = trade.status === 'open';
            const pnl = trade.profitLoss ?? 0;
            return (
              <Card
                key={trade.id}
                variant="default"
                padding="md"
                style={{ marginBottom: theme.spacing['2'] }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['3'] }}>
                    <View>
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
                      <Text
                        style={{
                          ...theme.typography.caption,
                          color: theme.colors.textTertiary,
                          marginTop: 2,
                        }}
                      >
                        {formatDate(trade.entryDate, 'relative')}
                      </Text>
                    </View>
                  </View>

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
                    {isOpen ? '—' : formatCurrency(pnl, activeAccount?.currency || 'USD')}
                  </Text>
                </View>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}
