import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme';
import { Screen } from '@/src/components/layout/Screen';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { useDataStore } from '@/src/store/useDataStore';
import { EMOTION_LABELS, MARKET_CONDITION_LABELS } from '@/src/types/trade';
import type { EmotionLevel, MarketCondition } from '@/src/types/trade';

export default function AddJournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { trades, addJournalEntry } = useDataStore();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<EmotionLevel>(3);
  const [marketCondition, setMarketCondition] = useState<MarketCondition>('calm');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [goals, setGoals] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedTradeIds, setLinkedTradeIds] = useState<string[]>([]);

  // Automatically find trades from the selected date to link
  useEffect(() => {
    const todayTrades = trades.filter((trade) => {
      const tradeDate = trade.entryDate.split('T')[0];
      return tradeDate === date;
    });
    setLinkedTradeIds(todayTrades.map((t) => t.id));
  }, [date, trades]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Silakan masukkan judul jurnal.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Silakan tulis isi jurnal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const journalData = {
        date,
        title: title.trim(),
        content: content.trim(),
        emotion,
        marketCondition,
        lessonsLearned: lessonsLearned.trim(),
        goals: goals.trim(),
        tradeIds: linkedTradeIds,
      };

      await addJournalEntry(journalData);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan catatan jurnal ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen scrollable={true}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: theme.spacing['4'], paddingTop: theme.spacing['2'] }}>
          {/* Date Picker (Simple Input text for simplicity of custom styling) */}
          <Input
            label="Tanggal Jurnal (YYYY-MM-DD)"
            placeholder="e.g. 2026-07-03"
            value={date}
            onChangeText={setDate}
          />

          {/* Title */}
          <Input
            label="Judul Catatan"
            placeholder="e.g. Hari yang produktif, Disiplin plan"
            value={title}
            onChangeText={setTitle}
          />

          {/* Market Condition */}
          <View style={{ gap: theme.spacing['1.5'] }}>
            <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary }}>
              Kondisi Pasar Utama
            </Text>
            <View style={styles.gridRow}>
              {(Object.keys(MARKET_CONDITION_LABELS) as MarketCondition[]).map((cond) => {
                const isSelected = marketCondition === cond;
                const info = MARKET_CONDITION_LABELS[cond];
                return (
                  <Pressable
                    key={cond}
                    onPress={() => setMarketCondition(cond)}
                    style={[
                      styles.gridBtn,
                      { backgroundColor: theme.colors.backgroundTertiary },
                      isSelected && { borderColor: theme.colors.primary, borderWidth: 1.5, backgroundColor: theme.colors.primary + '15' },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{info.emoji}</Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: isSelected ? theme.colors.primary : theme.colors.textSecondary, fontSize: 10 },
                      ]}
                    >
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Emotion scale */}
          <View style={{ gap: theme.spacing['1.5'] }}>
            <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary }}>
              Psikologi Hari Ini (Emosi)
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {(Object.keys(EMOTION_LABELS) as unknown as EmotionLevel[]).map((level) => {
                const isSelected = emotion === Number(level);
                const info = EMOTION_LABELS[level];
                return (
                  <Pressable
                    key={level}
                    onPress={() => setEmotion(Number(level) as EmotionLevel)}
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

          {/* Trades Link Info */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: theme.colors.backgroundTertiary,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
          >
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.text }}>
              🔗  Akan otomatis menghubungkan **{linkedTradeIds.length} transaksi** yang tercatat pada tanggal ini ({date}) ke dalam jurnal ini.
            </Text>
          </View>

          {/* Content */}
          <Input
            label="Isi Catatan Jurnal"
            placeholder="Bagaimana jalannya trading hari ini? Apakah Anda mengikuti plan? Apa yang dirasakan?"
            multiline
            numberOfLines={6}
            value={content}
            onChangeText={setContent}
            containerStyle={{ height: 120 }}
          />

          {/* Lessons Learned */}
          <Input
            label="Pelajaran Penting (Lessons Learned)"
            placeholder="Apa pelajaran yang bisa diambil dari pasar hari ini? (e.g. Kurangi FOMO)"
            multiline
            numberOfLines={3}
            value={lessonsLearned}
            onChangeText={setLessonsLearned}
            containerStyle={{ height: 80 }}
          />

          {/* Goals */}
          <Input
            label="Rencana & Goals Esok Hari"
            placeholder="Apa goals dan perbaikan yang ingin difokuskan esok hari?"
            multiline
            numberOfLines={3}
            value={goals}
            onChangeText={setGoals}
            containerStyle={{ height: 80 }}
          />

          <View style={{ height: theme.spacing['4'] }} />

          {/* Submit */}
          <Button
            title={isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}
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
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridBtn: {
    flex: 1,
    minWidth: '18%',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
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
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
