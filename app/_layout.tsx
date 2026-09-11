import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '@/app/context/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
      <NavigationThemeProvider
        value={
          colorScheme === 'dark'
            ? DarkTheme
            : DefaultTheme
        }
      >
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="productivity/index"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />

          <Stack.Screen
            name="calendar"
            options={{
              presentation: 'modal',
              title: 'Calendar',
            }}
          />

          <Stack.Screen
            name="assistant/index"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </Stack>

        <StatusBar style="auto" />
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}