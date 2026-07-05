/**
 * TradeMind — Card Component
 * Glassmorphism card with gradient border and shadow
 */

import React from 'react';
import {
  View,
  StyleSheet,
  type ViewProps,
  type ViewStyle,
  Pressable,
} from 'react-native';
import { useTheme } from '@/src/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  onPress,
  children,
  style,
  ...props
}: CardProps) {
  const theme = useTheme();

  const paddingValue = {
    none: 0,
    sm: theme.spacing['2'],
    md: theme.spacing['4'],
    lg: theme.spacing['6'],
  }[padding];

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    elevated: {
      backgroundColor: theme.colors.backgroundElevated,
      ...theme.shadows.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    glass: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
  };

  const cardStyle: ViewStyle = {
    borderRadius: theme.borderRadius.xl,
    padding: paddingValue,
    ...variantStyles[variant],
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
          style as ViewStyle,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}
