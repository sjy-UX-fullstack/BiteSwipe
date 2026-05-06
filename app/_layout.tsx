/**
 * BiteSwipe Root Layout
 * Forces dark theme & sets up the navigation stack.
 * On web, it constrains the app to a mobile-sized frame for a premium app feel.
 */

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Platform, StyleSheet, View } from 'react-native';
import { BrandColors } from '@/constants/theme';

// Custom dark theme matching our brand
const BiteSwipeTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: BrandColors.primaryStart,
    background: BrandColors.dark900,
    card: BrandColors.dark800,
    text: BrandColors.textPrimary,
    border: BrandColors.glassBorder,
    notification: BrandColors.error,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const content = (
    <ThemeProvider value={BiteSwipeTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Recipe Details',
            headerStyle: { backgroundColor: BrandColors.dark800 },
            headerTintColor: BrandColors.textPrimary,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            presentation: 'modal',
            title: 'My Profile',
            headerStyle: { backgroundColor: BrandColors.dark800 },
            headerTintColor: BrandColors.textPrimary,
          }}
        />
        <Stack.Screen
          name="see-all"
          options={{
            title: 'All Recipes',
            headerStyle: { backgroundColor: BrandColors.dark800 },
            headerTintColor: BrandColors.textPrimary,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );

  // If on web, wrap the entire app in a centered mobile frame
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.mobileFrame}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#000', // Pitch black outer background
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFrame: {
    width: '100%',
    maxWidth: 428, // iPhone 13 Pro Max width
    height: '100%',
    maxHeight: 926,
    overflow: 'hidden',
    backgroundColor: BrandColors.dark900,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BrandColors.glassBorder,
    boxShadow: '0 0 50px rgba(255, 107, 53, 0.1)',
  },
});
