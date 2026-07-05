/**
 * TradeMind — Input Component
 * Styled text input with label, error state, and icon support
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  type TextInputProps,
  type ViewStyle,
  Animated,
} from 'react-native';
import { useTheme } from '@/src/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  size = 'md',
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? theme.colors.loss : theme.colors.border as string,
      error ? theme.colors.loss : theme.colors.primary,
    ],
  });

  const inputHeight = {
    sm: 36,
    md: theme.dimensions.inputHeight,
    lg: 56,
  }[size];

  return (
    <View style={[{ gap: theme.spacing['1.5'] }, containerStyle]}>
      {label && (
        <Text
          style={{
            ...theme.typography.labelSmall,
            color: error ? theme.colors.loss : theme.colors.textSecondary,
          }}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: inputHeight,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1.5,
          borderColor: borderColor,
          backgroundColor: theme.colors.backgroundTertiary,
          paddingHorizontal: theme.spacing['3'],
          gap: theme.spacing['2'],
        }}
      >
        {leftIcon && (
          <View style={{ opacity: isFocused ? 1 : 0.5 }}>{leftIcon}</View>
        )}

        <TextInput
          style={{
            flex: 1,
            height: '100%',
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.base,
            color: theme.colors.text,
          }}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.colors.primary}
          {...props}
        />

        {rightIcon && <View>{rightIcon}</View>}
      </Animated.View>

      {(error || hint) && (
        <Text
          style={{
            ...theme.typography.caption,
            color: error ? theme.colors.loss : theme.colors.textTertiary,
          }}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
}
