/**
 * TradeMind — Root Layout
 * Sets up ThemeProvider, fonts, and navigation stack
 */

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/src/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const theme = useTheme();

  // Create navigation theme from our design system
  const navTheme = theme.isDark ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.backgroundSecondary,
      text: theme.colors.text,
      border: theme.colors.border as string,
      notification: theme.colors.loss,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.backgroundSecondary,
      text: theme.colors.text,
      border: theme.colors.border as string,
      notification: theme.colors.loss,
    },
  };

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-trade"
          options={{
            presentation: 'modal',
            title: 'Add Trade',
            headerStyle: { backgroundColor: theme.colors.backgroundSecondary },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="add-journal"
          options={{
            presentation: 'modal',
            title: 'Add Journal',
            headerStyle: { backgroundColor: theme.colors.backgroundSecondary },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="manage-accounts"
          options={{
            presentation: 'modal',
            title: 'Kelola Akun',
            headerStyle: { backgroundColor: theme.colors.backgroundSecondary },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerStyle: { backgroundColor: theme.colors.backgroundSecondary },
            headerTintColor: theme.colors.text,
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
