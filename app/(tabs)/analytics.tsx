/**
 * TradeMind — Analytics Screen
 * Detailed trading statistics and performance breakdown
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '@/src/theme';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { formatCurrency, formatPercentage } from '@/src/utils/formatters';
import { useDataStore } from '@/src/store/useDataStore';
import { useTradeStore } from '@/src/store/useTradeStore';
import { calculateTradeStats } from '@/src/utils/calculations';

type AnalyticsTab = 'overview' | 'pairs' | 'strategies';

function StatRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing['2.5'],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      }}
    >
      <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
        {label}
      </Text>
      <Text
        style={{
          ...theme.typography.numberSmall,
          color: valueColor ?? theme.colors.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function ProgressBar({
  value,
  maxValue,
  color,
}: {
  value: number;
  maxValue: number;
  color: string;
}) {
  const theme = useTheme();
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  return (
    <View
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.backgroundTertiary,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${percentage}%`,
          borderRadius: 3,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export default function AnalyticsScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  const { initData, trades, accounts, isLoading } = useDataStore();
  const { activeAccountId } = useTradeStore();

  useEffect(() => {
    initData();
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];
  const activeCurrency = activeAccount?.currency || 'USD';
  const activeAccountTrades = trades.filter((t) => t.accountId === activeAccount?.id);
  const closedTrades = activeAccountTrades.filter((t) => t.status === 'closed' && t.profitLoss !== null);

  // Compute stats in real-time
  const overviewStats = useMemo(() => {
    return calculateTradeStats(activeAccountTrades);
  }, [activeAccountTrades]);

  // Compute pair stats
  const pairStats = useMemo(() => {
    const map = new Map<string, { symbol: string; trades: number; wins: number; pnl: number }>();
    closedTrades.forEach((t) => {
      const existing = map.get(t.symbol) || { symbol: t.symbol, trades: 0, wins: 0, pnl: 0 };
      existing.trades += 1;
      if ((t.profitLoss ?? 0) > 0) {
        existing.wins += 1;
      }
      existing.pnl += t.profitLoss ?? 0;
      map.set(t.symbol, existing);
    });

    return Array.from(map.values())
      .map((p) => ({
        symbol: p.symbol,
        trades: p.trades,
        winRate: p.trades > 0 ? Math.round((p.wins / p.trades) * 1000) / 10 : 0,
        pnl: p.pnl,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades]);

  // Compute strategy stats
  const strategyStats = useMemo(() => {
    const map = new Map<string, { name: string; trades: number; wins: number; pnl: number; rrSum: number; rrCount: number }>();
    closedTrades.forEach((t) => {
      const name = t.strategy || 'No Strategy';
      const existing = map.get(name) || { name, trades: 0, wins: 0, pnl: 0, rrSum: 0, rrCount: 0 };
      existing.trades += 1;
      if ((t.profitLoss ?? 0) > 0) {
        existing.wins += 1;
      }
      existing.pnl += t.profitLoss ?? 0;
      if (t.riskRewardRatio !== null) {
        existing.rrSum += t.riskRewardRatio;
        existing.rrCount += 1;
      }
      map.set(name, existing);
    });

    return Array.from(map.values())
      .map((s) => ({
        name: s.name,
        trades: s.trades,
        winRate: s.trades > 0 ? Math.round((s.wins / s.trades) * 1000) / 10 : 0,
        pnl: s.pnl,
        avgRR: s.rrCount > 0 ? Math.round((s.rrSum / s.rrCount) * 10) / 10 : 1.0,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades]);

  const tabs: { key: AnalyticsTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'pairs', label: 'Per Pair' },
    { key: 'strategies', label: 'Strategies' },
  ];

  const maxPairPnl = useMemo(() => {
    if (pairStats.length === 0) return 0;
    return Math.max(...pairStats.map((p) => Math.abs(p.pnl)));
  }, [pairStats]);

  const maxStrategyPnl = useMemo(() => {
    if (strategyStats.length === 0) return 0;
    return Math.max(...strategyStats.map((s) => Math.abs(s.pnl)));
  }, [strategyStats]);

  return (
    <Screen loading={isLoading && trades.length === 0}>
      {/* Header */}
      <View style={{ paddingTop: theme.spacing['4'], marginBottom: theme.spacing['4'] }}>
        <Text style={{ ...theme.typography.h1, color: theme.colors.text }}>
          Analytics
        </Text>
      </View>

      {/* Tab Selector */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.backgroundTertiary,
          borderRadius: theme.borderRadius.lg,
          padding: 3,
          marginBottom: theme.spacing['4'],
        }}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing['2'],
              borderRadius: theme.borderRadius.md,
              alignItems: 'center',
              backgroundColor:
                activeTab === tab.key
                  ? theme.colors.primary
                  : 'transparent',
            }}
          >
            <Text
              style={{
                ...theme.typography.labelSmall,
                color:
                  activeTab === tab.key
                    ? '#FFFFFF'
                    : theme.colors.textSecondary,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing['3'],
              marginBottom: theme.spacing['4'],
            }}
          >
            <Card variant="glass" padding="md" style={{ flex: 1 }}>
              <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                Win Rate
              </Text>
              <Text
                style={{
                  ...theme.typography.numberLarge,
                  color: theme.colors.profit,
                  fontSize: 24,
                  marginTop: 4,
                }}
              >
                {overviewStats.winRate}%
              </Text>
            </Card>
            <Card variant="glass" padding="md" style={{ flex: 1 }}>
              <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                Profit Factor
              </Text>
              <Text
                style={{
                  ...theme.typography.numberLarge,
                  color: theme.colors.accent,
                  fontSize: 24,
                  marginTop: 4,
                }}
              >
                {overviewStats.profitFactor === Infinity ? '∞' : overviewStats.profitFactor.toFixed(2)}
              </Text>
            </Card>
            <Card variant="glass" padding="md" style={{ flex: 1 }}>
              <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                Expectancy
              </Text>
              <Text
                style={{
                  ...theme.typography.numberLarge,
                  color: overviewStats.expectancy >= 0 ? theme.colors.profit : theme.colors.loss,
                  fontSize: 24,
                  marginTop: 4,
                }}
              >
                {overviewStats.expectancy >= 0 ? '+' : ''}${overviewStats.expectancy.toFixed(1)}
              </Text>
            </Card>
          </View>

          {/* Detailed Stats */}
          <Card variant="default" padding="lg">
            <Text
              style={{
                ...theme.typography.h4,
                color: theme.colors.text,
                marginBottom: theme.spacing['2'],
              }}
            >
              Detail Performa
            </Text>
            <StatRow
              label="Rata-rata Profit"
              value={formatCurrency(overviewStats.averageWin, activeCurrency, false)}
              valueColor={theme.colors.profit}
            />
            <StatRow
              label="Rata-rata Loss"
              value={formatCurrency(overviewStats.averageLoss, activeCurrency, false)}
              valueColor={theme.colors.loss}
            />
            <StatRow
              label="Win Terbesar"
              value={formatCurrency(overviewStats.largestWin, activeCurrency)}
              valueColor={theme.colors.profit}
            />
            <StatRow
              label="Loss Terbesar"
              value={formatCurrency(overviewStats.largestLoss, activeCurrency)}
              valueColor={theme.colors.loss}
            />
            <StatRow label="Maks Win Beruntun" value={String(overviewStats.maxConsecutiveWins)} />
            <StatRow label="Maks Loss Beruntun" value={String(overviewStats.maxConsecutiveLosses)} />
            <StatRow
              label="Maks Drawdown"
              value={`${formatCurrency(overviewStats.maxDrawdown, activeCurrency, false)} (${overviewStats.maxDrawdownPercent}%)`}
              valueColor={theme.colors.loss}
            />
            <StatRow label="Rata-rata Risk-Reward" value={`1:${overviewStats.averageRiskReward}`} />
          </Card>
        </>
      )}

      {/* Pairs Tab */}
      {activeTab === 'pairs' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {pairStats.length === 0 ? (
            <Card variant="default" padding="lg" style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
                Belum ada data per pair
              </Text>
            </Card>
          ) : (
            pairStats.map((pair) => (
              <Card
                key={pair.symbol}
                variant="default"
                padding="md"
                style={{ marginBottom: theme.spacing['2'] }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing['2'],
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['2'] }}>
                    <Text style={{ ...theme.typography.label, color: theme.colors.text }}>
                      {pair.symbol}
                    </Text>
                    <Badge text={`${pair.trades} trades`} variant="neutral" />
                  </View>
                  <Text
                    style={{
                      ...theme.typography.numberSmall,
                      color: pair.pnl >= 0 ? theme.colors.profit : theme.colors.loss,
                    }}
                  >
                    {formatCurrency(pair.pnl, activeCurrency)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing['2'],
                  }}
                >
                  <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                    Win Rate: {pair.winRate}%
                  </Text>
                </View>
                <ProgressBar
                  value={Math.abs(pair.pnl)}
                  maxValue={maxPairPnl}
                  color={pair.pnl >= 0 ? theme.colors.profit : theme.colors.loss}
                />
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Strategies Tab */}
      {activeTab === 'strategies' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {strategyStats.length === 0 ? (
            <Card variant="default" padding="lg" style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
                Belum ada data strategi
              </Text>
            </Card>
          ) : (
            strategyStats.map((strategy) => (
              <Card
                key={strategy.name}
                variant="default"
                padding="md"
                style={{ marginBottom: theme.spacing['2'] }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing['2'],
                  }}
                >
                  <Text style={{ ...theme.typography.label, color: theme.colors.text }}>
                    {strategy.name}
                  </Text>
                  <Text
                    style={{
                      ...theme.typography.numberSmall,
                      color: strategy.pnl >= 0 ? theme.colors.profit : theme.colors.loss,
                    }}
                  >
                    {formatCurrency(strategy.pnl, activeCurrency)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: theme.spacing['3'],
                    marginBottom: theme.spacing['2'],
                  }}
                >
                  <Badge text={`${strategy.trades} trades`} variant="neutral" />
                  <Badge text={`WR ${strategy.winRate}%`} variant="profit" />
                  <Badge text={`RR 1:${strategy.avgRR}`} variant="primary" />
                </View>
                <ProgressBar
                  value={Math.abs(strategy.pnl)}
                  maxValue={maxStrategyPnl}
                  color={strategy.pnl >= 0 ? theme.colors.profit : theme.colors.loss}
                />
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
