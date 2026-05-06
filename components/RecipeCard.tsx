/**
 * RecipeCard — Premium swipeable recipe card with fixed image scaling and vector icons.
 */

import React from 'react';
import { StyleSheet, Text, View, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BrandColors, Gradients, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import type { Recipe } from '@/constants/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Responsive card width (mostly constrained by mobile frame if on web)
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 428 - 40);
const CARD_HEIGHT = CARD_WIDTH * 1.15;

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <View style={[styles.container, Shadows.card]}>
      <ImageBackground
        source={typeof recipe.image === 'string' ? { uri: recipe.image } : recipe.image}
        style={styles.image}
        imageStyle={styles.imageStyle}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
          style={styles.overlay}
        >
          {/* Match percentage badge */}
          {recipe.matchPercentage && (
            <View style={styles.matchBadge}>
              <LinearGradient
                colors={Gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.matchGradient}
              >
                <Text style={styles.matchText}>{recipe.matchPercentage}% Match</Text>
              </LinearGradient>
            </View>
          )}

          {/* Card content */}
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Feather name={recipe.icon as any || 'coffee'} size={24} color={BrandColors.textPrimary} />
            </View>
            <Text style={styles.title}>{recipe.title}</Text>
            <Text style={styles.cuisine}>{recipe.cuisine}</Text>

            {/* Tags */}
            <View style={styles.tags}>
              {recipe.tags.slice(0, 3).map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Stats row */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Feather name="clock" size={14} color={BrandColors.textSecondary} />
                <Text style={styles.statValue}>{recipe.cookTime}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Feather name="zap" size={14} color={BrandColors.textSecondary} />
                <Text style={styles.statValue}>{recipe.calories} cal</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Feather name="bar-chart-2" size={14} color={BrandColors.textSecondary} />
                <Text style={styles.statValue}>{recipe.difficulty}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    alignSelf: 'center',
    backgroundColor: BrandColors.dark600,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    borderRadius: Radius.xxl,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  matchBadge: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  matchGradient: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 2,
    borderRadius: Radius.full,
  },
  matchText: {
    color: BrandColors.textPrimary,
    ...Typography.caption,
    fontWeight: '700',
  },
  content: {
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxs,
  },
  title: {
    color: BrandColors.textPrimary,
    ...Typography.h1,
  },
  cuisine: {
    color: BrandColors.textSecondary,
    ...Typography.body,
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  tag: {
    backgroundColor: BrandColors.glass,
    borderWidth: 1,
    borderColor: BrandColors.glassBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.full,
  },
  tagText: {
    color: BrandColors.textSecondary,
    ...Typography.caption,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: BrandColors.glass,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: BrandColors.glassBorder,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statValue: {
    color: BrandColors.textPrimary,
    ...Typography.caption,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: BrandColors.glassBorder,
  },
});
