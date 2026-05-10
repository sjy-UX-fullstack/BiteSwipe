/**
 * BiteSwipe Tab Layout
 * Premium bottom tab bar with 5 tabs using Feather icons.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BrandColors, Gradients, Radius, Spacing } from '@/constants/theme';

function TabIcon({ icon, label, focused }: { icon: any; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      {focused ? (
        <LinearGradient
          colors={Gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeIndicator}
        >
          <Feather name={icon} size={20} color="#fff" />
        </LinearGradient>
      ) : (
        <View style={styles.inactiveIndicator}>
          <Feather name={icon} size={20} color={BrandColors.textTertiary} />
        </View>
      )}
      <Text style={[styles.label, focused && styles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Swipe',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="zap" label="Swipe" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="camera" label="Scan" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="search" label="Search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="users" label="Feed" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: BrandColors.dark800,
    borderTopWidth: 1,
    borderTopColor: BrandColors.glassBorder,
    height: Platform.OS === 'ios' ? 88 : 70,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.xs,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 56,
  },
  activeIndicator: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIndicator: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: BrandColors.textTertiary,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: BrandColors.primaryStart,
    fontWeight: '700',
  },
});
