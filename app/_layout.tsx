/**
 * BiteSwipe Root Layout
 * Forces dark theme & sets up the navigation stack.
 * On web, it constrains the app to a mobile-sized frame for a premium app feel.
 */

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { BrandColors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { getPrefs } from '@/services/userPrefs';
import { useEffect, useState } from 'react';

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

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  // null = unknown, true/false once Firestore answers
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  // Load onboarding status whenever the auth user changes.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setOnboardingComplete(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const prefs = await getPrefs();
      if (!cancelled) setOnboardingComplete(!!prefs.onboardingComplete);
    })();
    return () => { cancelled = true; };
  }, [user?.uid, loading]);

  useEffect(() => {
    if (loading) return;

    const top = segments[0] as string | undefined;
    const inAuthGroup = top === 'login' || top === 'signup';
    const inOnboarding = top === 'onboarding';

    if (!user) {
      // Not signed in — only auth screens are allowed.
      if (!inAuthGroup) router.replace('/login');
      return;
    }

    // Signed in, but we don't know onboarding status yet — wait.
    if (onboardingComplete === null) return;

    if (!onboardingComplete) {
      // Force onboarding before anything else.
      if (!inOnboarding) router.replace('/onboarding' as any);
    } else {
      // Onboarded — kick out of auth/onboarding screens into the app.
      if (inAuthGroup || inOnboarding) router.replace('/(tabs)');
    }
  }, [user, loading, segments, onboardingComplete]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BrandColors.dark900 }}>
        <ActivityIndicator size="large" color={BrandColors.primaryStart} />
      </View>
    );
  }

  return (
    <ThemeProvider value={BiteSwipeTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
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
        <Stack.Screen
          name="cook-mode"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
        <Stack.Screen name="saved" options={{ headerShown: false }} />
        <Stack.Screen name="preferences" options={{ headerShown: false }} />
        <Stack.Screen name="ai-recipe" options={{ headerShown: false }} />
        <Stack.Screen name="shopping-list" options={{ headerShown: false }} />
        <Stack.Screen name="meal-planner" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const content = (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
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
