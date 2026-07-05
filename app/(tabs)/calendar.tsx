/**
 * TradeMind — Calendar Screen
 * Trading calendar with heat map showing daily P&L
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import { useTheme } from '@/src/theme';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { useDataStore } from '@/src/store/useDataStore';
import { useTradeStore } from '@/src/store/useTradeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_GAP = 4;
const CELL_SIZE = (SCREEN_WIDTH - 32 - CELL_GAP * 6) / 7;

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-based (Mon=0)
  return day === 0 ? 6 : day - 1;
}

export default function CalendarScreen() {
  const theme = useTheme();

  const { initData, trades, journalEntries, accounts } = useDataStore();
  const { activeAccountId } = useTradeStore();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    initData();
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];
  const activeCurrency = activeAccount?.currency || 'USD';
  const activeAccountTrades = trades.filter((t) => t.accountId === activeAccount?.id);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group trades and journals by date
  const dailyPL = useMemo(() => {
    const record: Record<string, { pnl: number; trades: number; hasJournal: boolean }> = {};

    activeAccountTrades.forEach((t) => {
      if (t.status === 'closed' && t.profitLoss !== null) {
        const dateKey = t.exitDate ? t.exitDate.split('T')[0] : t.entryDate.split('T')[0];
        if (!record[dateKey]) {
          record[dateKey] = { pnl: 0, trades: 0, hasJournal: false };
        }
        record[dateKey].pnl += t.profitLoss;
        record[dateKey].trades += 1;
      }
    });

    journalEntries.forEach((j) => {
      const dateKey = j.date;
      if (!record[dateKey]) {
        record[dateKey] = { pnl: 0, trades: 0, hasJournal: true };
      } else {
        record[dateKey].hasJournal = true;
      }
    });

    return record;
  }, [activeAccountTrades, journalEntries]);

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }
    return cells;
  }, [firstDay, daysInMonth]);

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentDate(new Date(year, month + direction));
    setSelectedDate(null);
  };

  const getDateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getCellColor = (pnl: number) => {
    if (pnl > 50) return theme.colors.profit;
    if (pnl > 0) return theme.isDark ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.4)';
    if (pnl < -50) return theme.colors.loss;
    if (pnl < 0) return theme.isDark ? 'rgba(244, 63, 94, 0.5)' : 'rgba(244, 63, 94, 0.4)';
    return 'transparent';
  };

  const selectedData = selectedDate ? dailyPL[selectedDate] : null;

  // Selected date journal & trades
  const selectedDateTrades = useMemo(() => {
    if (!selectedDate) return [];
    return activeAccountTrades.filter((t) => {
      const dateKey = t.exitDate ? t.exitDate.split('T')[0] : t.entryDate.split('T')[0];
      return dateKey === selectedDate;
    });
  }, [selectedDate, activeAccountTrades]);

  const selectedDateJournal = useMemo(() => {
    if (!selectedDate) return null;
    return journalEntries.find((j) => j.date === selectedDate) || null;
  }, [selectedDate, journalEntries]);

  // Calculate monthly summary based on current month/year
  const monthlySummary = useMemo(() => {
    let pnl = 0;
    let tCount = 0;
    let pDays = 0;
    let tDays = 0;

    Object.keys(dailyPL).forEach((dateKey) => {
      const [y, m] = dateKey.split('-');
      if (parseInt(y) === year && parseInt(m) - 1 === month) {
        const data = dailyPL[dateKey];
        if (data.trades > 0) {
          pnl += data.pnl;
          tCount += data.trades;
          tDays += 1;
          if (data.pnl > 0) {
            pDays += 1;
          }
        }
      }
    });

    return { pnl, tCount, tDays, pDays };
  }, [dailyPL, year, month]);

  return (
    <Screen>
      {/* Header */}
      <View style={{ paddingTop: theme.spacing['4'], marginBottom: theme.spacing['4'] }}>
        <Text style={{ ...theme.typography.h1, color: theme.colors.text }}>
          Calendar
        </Text>
      </View>

      {/* Month Navigation */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing['4'],
        }}
      >
        <Pressable onPress={() => navigateMonth(-1)} style={{ padding: 8 }}>
          <Text style={{ ...theme.typography.h3, color: theme.colors.primary }}>‹</Text>
        </Pressable>
        <Text style={{ ...theme.typography.h2, color: theme.colors.text }}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={() => navigateMonth(1)} style={{ padding: 8 }}>
          <Text style={{ ...theme.typography.h3, color: theme.colors.primary }}>›</Text>
        </Pressable>
      </View>

      {/* Monthly Summary */}
      <Card variant="glass" padding="md" style={{ marginBottom: theme.spacing['4'] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
              P&L Bulan Ini
            </Text>
            <Text
              style={{
                ...theme.typography.number,
                color: monthlySummary.pnl >= 0 ? theme.colors.profit : theme.colors.loss,
              }}
            >
              {formatCurrency(monthlySummary.pnl, activeCurrency)}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
              Trading Days
            </Text>
            <Text style={{ ...theme.typography.number, color: theme.colors.text }}>
              {monthlySummary.tDays}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
              Profit Days
            </Text>
            <Text style={{ ...theme.typography.number, color: theme.colors.profit }}>
              {monthlySummary.pDays}/{monthlySummary.tDays}
            </Text>
          </View>
        </View>
      </Card>

      {/* Calendar Grid */}
      <Card variant="default" padding="md">
        {/* Day headers */}
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing['2'] }}>
          {DAYS.map((day) => (
            <View
              key={day}
              style={{
                width: CELL_SIZE,
                alignItems: 'center',
                marginRight: CELL_GAP,
              }}
            >
              <Text
                style={{
                  ...theme.typography.caption,
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.semiBold,
                }}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar cells */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {calendarCells.map((day, index) => {
            if (day === null) {
              return (
                <View
                  key={`empty-${index}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    marginRight: CELL_GAP,
                    marginBottom: CELL_GAP,
                  }}
                />
              );
            }

            const dateKey = getDateKey(day);
            const dayData = dailyPL[dateKey];
            const isSelected = selectedDate === dateKey;
            const todayStrStr = new Date().toISOString().split('T')[0];
            const isToday = dateKey === todayStrStr;

            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDate(isSelected ? null : dateKey)}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  marginRight: CELL_GAP,
                  marginBottom: CELL_GAP,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: dayData && dayData.trades > 0
                    ? getCellColor(dayData.pnl)
                    : theme.colors.backgroundTertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isSelected ? 2 : isToday ? 1 : 0,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : isToday
                      ? theme.colors.accent
                      : 'transparent',
                }}
              >
                <Text
                  style={{
                    ...theme.typography.labelSmall,
                    color: dayData && dayData.trades > 0
                      ? '#FFFFFF'
                      : theme.colors.textSecondary,
                    fontSize: 12,
                  }}
                >
                  {day}
                </Text>
                {dayData && dayData.trades > 0 && (
                  <Text
                    style={{
                      fontSize: 8,
                      color: 'rgba(255,255,255,0.8)',
                      fontFamily: theme.fontFamily.medium,
                      marginTop: 1,
                    }}
                  >
                    {dayData.trades}t
                  </Text>
                )}
                {dayData && dayData.hasJournal && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.colors.primary,
                      position: 'absolute',
                      bottom: 2,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Selected Day Detail */}
      {selectedDate && (
        <ScrollView style={{ marginTop: theme.spacing['4'] }} showsVerticalScrollIndicator={false}>
          <Card variant="elevated" padding="lg">
            <Text style={{ ...theme.typography.h4, color: theme.colors.text, marginBottom: 8 }}>
              {new Date(selectedDate).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
            {selectedData && selectedData.trades > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  gap: theme.spacing['6'],
                  marginTop: theme.spacing['2'],
                  marginBottom: theme.spacing['3'],
                }}
              >
                <View>
                  <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                    Total P&L
                  </Text>
                  <Text
                    style={{
                      ...theme.typography.number,
                      color: selectedData.pnl >= 0 ? theme.colors.profit : theme.colors.loss,
                    }}
                  >
                    {formatCurrency(selectedData.pnl, activeCurrency)}
                  </Text>
                </View>
                <View>
                  <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                    Transaksi
                  </Text>
                  <Text style={{ ...theme.typography.number, color: theme.colors.text }}>
                    {selectedData.trades}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, marginVertical: 4 }}>
                Tidak ada aktivitas transaksi pada tanggal ini
              </Text>
            )}

            {/* Daily Journal details */}
            {selectedDateJournal && (
              <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.borderSubtle, paddingTop: 10, marginTop: 10 }}>
                <Text style={{ ...theme.typography.label, color: theme.colors.text }}>
                  📝 Jurnal: {selectedDateJournal.title}
                </Text>
                <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 4 }}>
                  {selectedDateJournal.content}
                </Text>
              </View>
            )}
          </Card>
        </ScrollView>
      )}
    </Screen>
  );
}
