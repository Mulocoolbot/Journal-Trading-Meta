import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme';
import { Screen } from '@/src/components/layout/Screen';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useDataStore } from '@/src/store/useDataStore';
import { calculateProfitLoss, calculatePips, calculateRiskReward } from '@/src/utils/calculations';
import { EMOTION_LABELS, TIMEFRAMES, TIMEFRAME_LABELS } from '@/src/types/trade';
import type { Instrument, TradeDirection, Timeframe, EmotionLevel } from '@/src/types/trade';

export default function AddTradeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { accounts, addTrade } = useDataStore();

  const activeAccount = accounts.find((a) => a.isDefault) || accounts[0];

  // Form states
  const [symbol, setSymbol] = useState('');
  const [instrument, setInstrument] = useState<Instrument>('forex');
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [lotSize, setLotSize] = useState('0.01');
  const [commission, setCommission] = useState('0');
  const [swap, setSwap] = useState('0');
  const [strategy, setStrategy] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('H1');
  const [emotionEntry, setEmotionEntry] = useState<EmotionLevel | null>(null);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  // Auto-calculated states
  const [estimatedPL, setEstimatedPL] = useState<number | null>(null);
  const [estimatedPips, setEstimatedPips] = useState<number | null>(null);
  const [riskReward, setRiskReward] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger calculations on state change
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const lot = parseFloat(lotSize);
    const comm = parseFloat(commission) || 0;
    const swp = parseFloat(swap) || 0;

    if (!isNaN(entry) && !isNaN(exit) && !isNaN(lot)) {
      const pl = calculateProfitLoss(entry, exit, direction, lot, symbol || 'EURUSD', instrument, comm, swp);
      const pips = calculatePips(entry, exit, direction, symbol || 'EURUSD');
      setEstimatedPL(pl);
      setEstimatedPips(pips);
    } else {
      setEstimatedPL(null);
      setEstimatedPips(null);
    }

    if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp)) {
      const rr = calculateRiskReward(entry, sl, tp, direction);
      setRiskReward(rr);
    } else {
      setRiskReward(null);
    }
  }, [entryPrice, exitPrice, stopLoss, takeProfit, lotSize, direction, symbol, instrument, commission, swap]);

  const handleSubmit = async () => {
    if (!symbol.trim()) {
      Alert.alert('Error', 'Silakan masukkan simbol instrumen (contoh: EURUSD).');
      return;
    }
    const entry = parseFloat(entryPrice);
    const lot = parseFloat(lotSize);

    if (isNaN(entry) || entry <= 0) {
      Alert.alert('Error', 'Silakan masukkan harga entry yang valid.');
      return;
    }
    if (isNaN(lot) || lot <= 0) {
      Alert.alert('Error', 'Silakan masukkan lot size yang valid.');
      return;
    }

    if (!activeAccount) {
      Alert.alert('Error', 'Tidak ada akun trading aktif. Silakan buat akun terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isClosed = exitPrice.trim() !== '';
      const exit = isClosed ? parseFloat(exitPrice) : null;
      const sl = stopLoss.trim() !== '' ? parseFloat(stopLoss) : null;
      const tp = takeProfit.trim() !== '' ? parseFloat(takeProfit) : null;
      const comm = parseFloat(commission) || 0;
      const swp = parseFloat(swap) || 0;

      const tradeData = {
        instrument,
        symbol: symbol.toUpperCase().trim(),
        direction,
        entryPrice: entry,
        exitPrice: exit,
        stopLoss: sl,
        takeProfit: tp,
        lotSize: lot,
        leverage: null,
        commission: comm,
        swap: swp,
        profitLoss: estimatedPL,
        profitLossPips: estimatedPips,
        riskRewardRatio: riskReward,
        strategy: strategy.trim(),
        timeframe,
        entryDate: new Date().toISOString(),
        exitDate: isClosed ? new Date().toISOString() : null,
        status: isClosed ? ('closed' as const) : ('open' as const),
        screenshots: [],
        notes: notes.trim(),
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        emotionEntry,
        emotionExit: isClosed ? emotionEntry : null, // Simplify exit emotion
        source: 'manual' as const,
        externalId: null,
        accountId: activeAccount.id,
      };

      await addTrade(tradeData);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan transaksi ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const instrumentTypes: { key: Instrument; label: string }[] = [
    { key: 'forex', label: 'Forex' },
    { key: 'crypto', label: 'Crypto' },
    { key: 'stocks', label: 'Stocks' },
    { key: 'futures', label: 'Futures' },
  ];

  return (
    <Screen scrollable={true}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: theme.spacing['4'], paddingTop: theme.spacing['2'] }}>
          {/* Symbol */}
          <Input
            label="Symbol / Pair"
            placeholder="e.g. EURUSD, XAUUSD, BTCUSD"
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />

          {/* Instrument Type & Direction Grid */}
          <View style={{ flexDirection: 'row', gap: theme.spacing['3'] }}>
            <View style={{ flex: 1, gap: theme.spacing['1.5'] }}>
              <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary }}>
                Instrument
              </Text>
              <View style={styles.selectorRow}>
                {instrumentTypes.map((type) => (
                  <Pressable
                    key={type.key}
                    onPress={() => setInstrument(type.key)}
                    style={[
                      styles.selectorItem,
                      { backgroundColor: theme.colors.backgroundTertiary },
                      instrument === type.key && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary, fontSize: 11 },
                        instrument === type.key && { color: '#FFFFFF', fontFamily: theme.fontFamily.semiBold },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Buy / Sell Toggle */}
          <View style={{ gap: theme.spacing['1.5'] }}>
            <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary }}>
              Arah Transaksi
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing['3'] }}>
              <Pressable
                onPress={() => setDirection('long')}
                style={[
                  styles.toggleBtn,
                  { backgroundColor: theme.colors.backgroundTertiary },
                  direction === 'long' && { backgroundColor: theme.colors.profit },
                ]}
              >
                <Text style={{ ...theme.typography.label, color: direction === 'long' ? '#FFFFFF' : theme.colors.text }}>
                  📈 BUY / LONG
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDirection('short')}
                style={[
                  styles.toggleBtn,
                  { backgroundColor: theme.colors.backgroundTertiary },
                  direction === 'short' && { backgroundColor: theme.colors.loss },
                ]}
              >
                <Text style={{ ...theme.typography.label, color: direction === 'short' ? '#FFFFFF' : theme.colors.text }}>
                  📉 SELL / SHORT
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Pricing Grid */}
          <View style={{ flexDirection: 'row', gap: theme.spacing['3'] }}>
            <Input
              label="Harga Entry"
              placeholder="1.08500"
              keyboardType="numeric"
              value={entryPrice}
              onChangeText={setEntryPrice}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Harga Exit (Opsional)"
              placeholder="1.09200"
              keyboardType="numeric"
              value={exitPrice}
              onChangeText={setExitPrice}
              containerStyle={{ flex: 1 }}
              hint="Kosongkan jika transaksi terbuka"
            />
          </View>

          {/* SL & TP Grid */}
          <View style={{ flexDirection: 'row', gap: theme.spacing['3'] }}>
            <Input
              label="Stop Loss (SL)"
              placeholder="1.08000"
              keyboardType="numeric"
              value={stopLoss}
              onChangeText={setStopLoss}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Take Profit (TP)"
              placeholder="1.09500"
              keyboardType="numeric"
              value={takeProfit}
              onChangeText={setTakeProfit}
              containerStyle={{ flex: 1 }}
            />
          </View>

          {/* Lot Size, Commission, Swap */}
          <View style={{ flexDirection: 'row', gap: theme.spacing['2'] }}>
            <Input
              label="Lot Size"
              placeholder="0.01"
              keyboardType="numeric"
              value={lotSize}
              onChangeText={setLotSize}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Commission"
              placeholder="0"
              keyboardType="numeric"
              value={commission}
              onChangeText={setCommission}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Swap"
              placeholder="0"
              keyboardType="numeric"
              value={swap}
              onChangeText={setSwap}
              containerStyle={{ flex: 1 }}
            />
          </View>

          {/* Strategy & Timeframe */}
          <View style={{ flexDirection: 'row', gap: theme.spacing['3'] }}>
            <Input
              label="Strategy / Setup"
              placeholder="e.g. Breakout, Pullback"
              value={strategy}
              onChangeText={setStrategy}
              containerStyle={{ flex: 1.5 }}
            />
            <View style={{ flex: 1, gap: theme.spacing['1.5'] }}>
              <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary }}>
                Timeframe
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, height: 42 }}
              >
                {TIMEFRAMES.map((tf) => (
                  <Pressable
                    key={tf}
                    onPress={() => setTimeframe(tf)}
                    style={[
                      styles.tfBadge,
                      { backgroundColor: theme.colors.backgroundTertiary },
                      timeframe === tf && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary },
                        timeframe === tf && { color: '#FFFFFF', fontFamily: theme.fontFamily.semiBold },
                      ]}
                    >
                      {tf}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Estimated Stats Panel */}
          {(estimatedPL !== null || riskReward !== null) && (
            <View
              style={[
                styles.statsPanel,
                {
                  backgroundColor: theme.colors.backgroundTertiary,
                  borderColor: theme.colors.borderSubtle,
                },
              ]}
            >
              <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary }}>
                Estimasi Hasil Transaksi
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing['2'] }}>
                {estimatedPL !== null && (
                  <View>
                    <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>P&L Est.</Text>
                    <Text
                      style={{
                        ...theme.typography.number,
                        color: estimatedPL >= 0 ? theme.colors.profit : theme.colors.loss,
                        fontSize: 16,
                      }}
                    >
                      {estimatedPL >= 0 ? '+' : ''}${estimatedPL.toFixed(2)} ({estimatedPips} pips)
                    </Text>
                  </View>
                )}
                {riskReward !== null && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>R:R Ratio</Text>
                    <Text style={{ ...theme.typography.number, color: theme.colors.text, fontSize: 16 }}>
                      1 : {riskReward.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Emotion Entry */}
          <View style={{ gap: theme.spacing['2'] }}>
            <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary }}>
              Kondisi Psikologis (Entry)
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {(Object.keys(EMOTION_LABELS) as unknown as EmotionLevel[]).map((level) => {
                const isSelected = emotionEntry === Number(level);
                const info = EMOTION_LABELS[level];
                return (
                  <Pressable
                    key={level}
                    onPress={() => setEmotionEntry(Number(level) as EmotionLevel)}
                    style={[
                      styles.emotionBtn,
                      { backgroundColor: theme.colors.backgroundTertiary },
                      isSelected && { borderColor: info.color, borderWidth: 1.5, backgroundColor: info.color + '15' },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{info.emoji}</Text>
                    <Text style={{ fontSize: 9, color: isSelected ? info.color : theme.colors.textTertiary }}>
                      {info.label.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Tags */}
          <Input
            label="Tags"
            placeholder="e.g. FOMO, trend-line, key-level (pisahkan dengan koma)"
            value={tags}
            onChangeText={setTags}
          />

          {/* Notes */}
          <Input
            label="Catatan Trading"
            placeholder="Tuliskan analisis atau alasan dibalik pengambilan trade ini..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            containerStyle={{ height: 100 }}
          />

          <View style={{ height: theme.spacing['4'] }} />

          {/* Submit */}
          <Button
            title={isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectorItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  toggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tfBadge: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsPanel: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  emotionBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginHorizontal: 2,
  },
});
