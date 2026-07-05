/**
 * TradeMind — Journal Screen
 * Daily trading journal with emotion tracking and market analysis
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { EMOTION_LABELS, MARKET_CONDITION_LABELS } from '@/src/types/trade';
import { useDataStore } from '@/src/store/useDataStore';
import type { JournalEntry } from '@/src/types/trade';

function JournalCard({ entry }: { entry: JournalEntry }) {
  const theme = useTheme();
  const emotionInfo = EMOTION_LABELS[entry.emotion] || EMOTION_LABELS[3];
  const marketInfo = MARKET_CONDITION_LABELS[entry.marketCondition] || MARKET_CONDITION_LABELS['calm'];

  const dateObj = new Date(entry.date);
  const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
  const dateStr = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card
      variant="default"
      padding="lg"
      style={{ marginBottom: theme.spacing['3'] }}
      onPress={() => {}}
    >
      {/* Date & Emotion */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing['3'],
        }}
      >
        <View>
          <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textTertiary }}>
            {dayName}
          </Text>
          <Text style={{ ...theme.typography.h3, color: theme.colors.text }}>
            {dateStr}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 28 }}>{emotionInfo.emoji}</Text>
          <Text
            style={{
              ...theme.typography.caption,
              color: emotionInfo.color,
              marginTop: 2,
            }}
          >
            {emotionInfo.label}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text
        style={{
          ...theme.typography.label,
          color: theme.colors.text,
          marginBottom: theme.spacing['2'],
        }}
      >
        {entry.title}
      </Text>

      {/* Content preview */}
      <Text
        style={{
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing['3'],
        }}
        numberOfLines={3}
      >
        {entry.content}
      </Text>

      {/* Lessons Learned */}
      {entry.lessonsLearned ? (
        <View
          style={{
            backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.06)',
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing['3'],
            marginBottom: theme.spacing['3'],
          }}
        >
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.primary,
              marginBottom: 4,
            }}
          >
            💡 Lessons Learned
          </Text>
          <Text
            style={{
              ...theme.typography.bodySmall,
              color: theme.colors.text,
            }}
          >
            {entry.lessonsLearned}
          </Text>
        </View>
      ) : null}

      {/* Goals */}
      {entry.goals ? (
        <View
          style={{
            backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing['3'],
            marginBottom: theme.spacing['3'],
          }}
        >
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.profit,
              marginBottom: 4,
            }}
          >
            🎯 Rencana & Goals
          </Text>
          <Text
            style={{
              ...theme.typography.bodySmall,
              color: theme.colors.text,
            }}
          >
            {entry.goals}
          </Text>
        </View>
      ) : null}

      {/* Tags */}
      <View style={{ flexDirection: 'row', gap: theme.spacing['2'] }}>
        <Badge text={`${marketInfo.emoji} ${marketInfo.label}`} variant="neutral" />
        {entry.tradeIds.length > 0 ? (
          <Badge text={`${entry.tradeIds.length} trades linked`} variant="primary" />
        ) : null}
      </View>
    </Card>
  );
}

export default function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { initData, journalEntries, isLoading } = useDataStore();

  useEffect(() => {
    initData();
  }, []);

  return (
    <Screen loading={isLoading && journalEntries.length === 0}>
      {/* Header */}
      <View
        style={{
          paddingTop: theme.spacing['4'],
          marginBottom: theme.spacing['4'],
        }}
      >
        <Text style={{ ...theme.typography.h1, color: theme.colors.text }}>
          Journal
        </Text>
        <Text
          style={{
            ...theme.typography.bodySmall,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing['1'],
          }}
        >
          Catatan harian trading kamu
        </Text>
      </View>

      {/* Today's Journal Button */}
      <Button
        title="✍️  Tulis Journal Hari Ini"
        onPress={() => router.push('/add-journal' as any)}
        variant="primary"
        fullWidth
        size="lg"
      />

      <View style={{ height: theme.spacing['4'] }} />

      {/* Journal Entries */}
      {journalEntries.length === 0 ? (
        <Card variant="default" padding="lg" style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
            Belum ada catatan jurnal
          </Text>
          <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 4 }}>
            Tulis jurnal pertama Anda hari ini untuk mencatat evaluasi psikologis dan kondisi pasar
          </Text>
        </Card>
      ) : (
        journalEntries.map((entry) => (
          <JournalCard key={entry.id} entry={entry} />
        ))
      )}
    </Screen>
  );
}
