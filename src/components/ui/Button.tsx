/**
 * TradeMind — Button Component
 * Premium button with multiple variants and micro-animations
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
  View,
} from 'react-native';
import { useTheme } from '@/src/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const sizeConfig = {
    sm: {
      height: theme.dimensions.buttonHeightSm,
      paddingHorizontal: theme.spacing['3'],
      fontSize: theme.fontSize.sm,
      iconSize: 14,
    },
    md: {
      height: theme.dimensions.buttonHeight,
      paddingHorizontal: theme.spacing['5'],
      fontSize: theme.fontSize.base,
      iconSize: 18,
    },
    lg: {
      height: theme.dimensions.buttonHeightLg,
      paddingHorizontal: theme.spacing['7'],
      fontSize: theme.fontSize.md,
      iconSize: 20,
    },
  }[size];

  const variantStyles: Record<ButtonVariant, { bg: ViewStyle; text: TextStyle }> = {
    primary: {
      bg: { backgroundColor: theme.colors.primary },
      text: { color: '#FFFFFF' },
    },
    secondary: {
      bg: { backgroundColor: theme.colors.backgroundTertiary },
      text: { color: theme.colors.text },
    },
    outline: {
      bg: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
      },
      text: { color: theme.colors.primary },
    },
    ghost: {
      bg: { backgroundColor: 'transparent' },
      text: { color: theme.colors.primary },
    },
    danger: {
      bg: { backgroundColor: theme.colors.loss },
      text: { color: '#FFFFFF' },
    },
    success: {
      bg: { backgroundColor: theme.colors.profit },
      text: { color: '#FFFFFF' },
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: theme.borderRadius.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing['2'],
          ...currentVariant.bg,
          opacity: isDisabled ? 0.5 : 1,
        },
        pressed && !isDisabled && {
          opacity: 0.85,
          transform: [{ scale: 0.97 }],
        },
        fullWidth && { width: '100%' },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={currentVariant.text.color as string}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              {
                fontFamily: theme.fontFamily.semiBold,
                fontSize: sizeConfig.fontSize,
                letterSpacing: 0.3,
              },
              currentVariant.text,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
}
