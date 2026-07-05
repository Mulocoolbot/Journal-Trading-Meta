/**
 * TradeMind — Screen Layout Component
 * Consistent screen wrapper with safe area and scroll support
 */

import React from 'react';
import {
  View,
  ScrollView,
  type ViewStyle,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  loading?: boolean;
}

export function Screen({
  children,
  scrollable = true,
  padding = true,
  style,
  contentContainerStyle,
  loading = false,
}: ScreenProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };

  const contentStyle: ViewStyle = {
    ...(padding && {
      paddingHorizontal: theme.dimensions.screenPadding,
    }),
  };

  return (
    <SafeAreaView style={[containerStyle, style]} edges={['top']}>
      <StatusBar
        barStyle={theme.colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            contentStyle,
            { paddingBottom: theme.spacing['20'] },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
