/**
 * GradientButton — Primary CTA button with gradient background.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography, Shadows } from '@/constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  icon?: string;
}

export default function GradientButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style,
  icon,
}: GradientButtonProps) {
  const gradient = variant === 'primary' ? Gradients.primary : Gradients.secondary;
  const sizeStyles = {
    small: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
    medium: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    large: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, sizeStyles[size], Shadows.glow]}
      >
        <Text style={styles.text}>
          {icon ? `${icon}  ` : ''}{title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    color: BrandColors.textPrimary,
    ...Typography.bodyBold,
    letterSpacing: 0.3,
  },
});
