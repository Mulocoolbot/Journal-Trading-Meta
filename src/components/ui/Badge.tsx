/**
 * TradeMind — Badge Component
 * Small label badges for trade status, instrument type, etc.
 */

import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme';

type BadgeVariant = 'profit' | 'loss' | 'neutral' | 'primary' | 'warning' | 'long' | 'short';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({
  text,
  variant = 'neutral',
  size = 'sm',
  icon,
}: BadgeProps) {
  const theme = useTheme();

  const variantConfig: Record<BadgeVariant, { bg: string; text: string }> = {
    profit: {
      bg: theme.colors.profitBackground,
      text: theme.colors.profit,
    },
    loss: {
      bg: theme.colors.lossBackground,
      text: theme.colors.loss,
    },
    neutral: {
      bg: theme.colors.backgroundTertiary,
      text: theme.colors.textSecondary,
    },
    primary: {
      bg: theme.isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.1)',
      text: theme.colors.primary,
    },
    warning: {
      bg: theme.colors.warningBackground,
      text: theme.colors.warning,
    },
    long: {
      bg: theme.colors.profitBackground,
      text: theme.colors.profit,
    },
    short: {
      bg: theme.colors.lossBackground,
      text: theme.colors.loss,
    },
  };

  const config = variantConfig[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 3 : 5,
        borderRadius: theme.borderRadius.full,
        backgroundColor: config.bg,
      }}
    >
      {icon}
      <Text
        style={{
          fontFamily: theme.fontFamily.semiBold,
          fontSize: isSmall ? theme.fontSize['2xs'] : theme.fontSize.xs,
          color: config.text,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {text}
      </Text>
    </View>
  );
}
