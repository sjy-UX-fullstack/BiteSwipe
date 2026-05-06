/**
 * GlassCard — Frosted glass surface component.
 * Core UI primitive for BiteSwipe's glassmorphism aesthetic.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BrandColors, Radius, Spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
}

export default function GlassCard({ children, style, intensity = 'medium' }: GlassCardProps) {
  const opacityMap = {
    light: 0.04,
    medium: 0.07,
    heavy: 0.12,
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: `rgba(255, 255, 255, ${opacityMap[intensity]})` },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: BrandColors.glassBorder,
    padding: Spacing.md,
    overflow: 'hidden',
  },
});
