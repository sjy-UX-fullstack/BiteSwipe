/**
 * Trending Recipe Screen — shows an AI-extracted recipe from a viral link or tile tap.
 */
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';

export default function TrendingRecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title: string;
    ingredients: string;
    steps: string;
    cookTime: string;
    calories: string;
    difficulty: string;
    cuisine: string;
    source: string;
    views?: string;
  }>();

  const ingredients: string[] = JSON.parse(params.ingredients || '[]');
  const steps: string[] = JSON.parse(params.steps || '[]');

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Hero gradient header */}
        <LinearGradient
          colors={['rgba(255,107,53,0.18)', 'rgba(255,45,135,0.08)', BrandColors.dark900]}
          style={s.heroGradient}
        >
          <View style={s.sourcePill}>
            <Feather name="trending-up" size={12} color={BrandColors.primaryStart} style={{ marginRight: 4 }} />
            <Text style={s.sourceText}>
              {params.source?.includes('instagram') ? 'Instagram' : params.source?.includes('youtube') ? 'YouTube' : 'Trending'}
              {params.views ? ` · ${params.views} views` : ''}
            </Text>
          </View>
          <Text style={s.title}>{params.title}</Text>
          <Text style={s.cuisine}>{params.cuisine} · {params.difficulty}</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={s.stats}>
          <View style={s.stat}>
            <Feather name="clock" size={16} color={BrandColors.primaryStart} />
            <Text style={s.statT}>{params.cookTime}</Text>
          </View>
          <View style={s.stat}>
            <Feather name="zap" size={16} color={BrandColors.primaryStart} />
            <Text style={s.statT}>{params.calories} cal</Text>
          </View>
          <View style={s.stat}>
            <Feather name="bar-chart-2" size={16} color={BrandColors.primaryStart} />
            <Text style={s.statT}>{params.difficulty}</Text>
          </View>
        </View>

        {/* AI generated label */}
        <View style={s.aiBanner}>
          <Feather name="cpu" size={14} color={BrandColors.accent} style={{ marginRight: 6 }} />
          <Text style={s.aiText}>Recipe extracted by Gemini AI</Text>
        </View>

        {/* Ingredients */}
        <Text style={s.sectionTitle}>Ingredients</Text>
        <View style={s.ingList}>
          {ingredients.map((ing, i) => (
            <View key={i} style={s.ingItem}>
              <Feather name="check-circle" size={16} color={BrandColors.success} />
              <Text style={s.ingText}>{ing}</Text>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <Text style={s.sectionTitle}>Instructions</Text>
        <View style={s.stepList}>
          {steps.map((step, i) => (
            <View key={i} style={s.stepItem}>
              <LinearGradient colors={Gradients.primary as [string, string]} style={s.stepNum}>
                <Text style={s.stepNumT}>{i + 1}</Text>
              </LinearGradient>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Start Cooking CTA */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={{ flex: 1 }}
          onPress={() =>
            router.push({
              pathname: '/cook-mode',
              params: {
                title: params.title,
                steps: params.steps,
              },
            })
          }
        >
          <LinearGradient
            colors={Gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.cookBtn}
          >
            <Feather name="play-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.cookBtnT}>Start Cooking</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  scroll: { paddingBottom: 100 },
  heroGradient: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  sourcePill: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  sourceText: { color: BrandColors.primaryStart, ...Typography.caption, fontWeight: '700' },
  title: { color: BrandColors.textPrimary, ...Typography.h1, marginBottom: Spacing.xs },
  cuisine: { color: BrandColors.textSecondary, ...Typography.body },
  stats: { flexDirection: 'row', gap: Spacing.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: BrandColors.dark800, padding: Spacing.md, borderRadius: Radius.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1, justifyContent: 'center' },
  statT: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  aiBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: 'rgba(255,209,102,0.08)', padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(255,209,102,0.2)' },
  aiText: { color: BrandColors.accent, ...Typography.caption },
  sectionTitle: { color: BrandColors.textPrimary, ...Typography.h2, marginBottom: Spacing.md, marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
  ingList: { gap: Spacing.sm, marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  ingItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ingText: { color: BrandColors.textSecondary, ...Typography.body, flex: 1 },
  stepList: { gap: Spacing.lg, paddingHorizontal: Spacing.lg },
  stepItem: { flexDirection: 'row', gap: Spacing.md },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumT: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepText: { color: BrandColors.textSecondary, ...Typography.body, flex: 1, lineHeight: 22 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: BrandColors.dark900, borderTopWidth: 1, borderTopColor: BrandColors.glassBorder },
  cookBtn: { paddingVertical: Spacing.md, borderRadius: Radius.full, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  cookBtnT: { color: '#fff', ...Typography.bodyBold, fontSize: 16 },
});
