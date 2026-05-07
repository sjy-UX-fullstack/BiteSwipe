/**
 * See All Recipes Screen — supports optional id filter for scan results.
 */
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_RECIPES } from '@/constants/mock-data';

export default function SeeAllScreen() {
  const { ids, title } = useLocalSearchParams<{ ids?: string; title?: string }>();
  const router = useRouter();

  const recipes = ids
    ? ids.split(',').map(id => MOCK_RECIPES.find(r => r.id === id)).filter(Boolean) as typeof MOCK_RECIPES
    : MOCK_RECIPES;

  const screenTitle = title || 'All Recipes';

  return (
    <View style={s.screen}>
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>{screenTitle}</Text>
        {ids && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{recipes.length} matches</Text>
          </View>
        )}
      </View>

      {recipes.length === 0 ? (
        <View style={s.empty}>
          <Feather name="search" size={48} color={BrandColors.textTertiary} />
          <Text style={s.emptyTitle}>No matches found</Text>
          <Text style={s.emptyDesc}>Try scanning with more ingredients or deselecting some filters.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <View style={s.grid}>
            {recipes.map(r => (
              <TouchableOpacity
                key={r.id}
                style={s.card}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/modal', params: { id: r.id } })}
              >
                <View style={s.imgWrap}>
                  <Image
                    source={typeof r.image === 'string' ? { uri: r.image } : r.image}
                    style={s.img}
                    resizeMode="cover"
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={s.imgOverlay}>
                    {r.matchPercentage !== undefined && (
                      <LinearGradient colors={Gradients.primary as [string, string]} style={s.matchBadge}>
                        <Text style={s.matchText}>{r.matchPercentage}%</Text>
                      </LinearGradient>
                    )}
                    <Text style={s.rName} numberOfLines={2}>{r.title}</Text>
                    <Text style={s.rMeta}>{r.cookTime} · {r.calories} cal</Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  headerTitle: { color: BrandColors.textPrimary, ...Typography.h2, flex: 1 },
  badge: { backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs, borderRadius: Radius.full },
  badgeText: { color: BrandColors.primaryStart, ...Typography.caption, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxl },
  emptyTitle: { color: BrandColors.textPrimary, ...Typography.h3 },
  emptyDesc: { color: BrandColors.textTertiary, ...Typography.body, textAlign: 'center' },
  scroll: { padding: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.md },
  card: { width: '48%', aspectRatio: 0.8, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: BrandColors.dark600 },
  imgWrap: { flex: 1 },
  img: { width: '100%', height: '100%', position: 'absolute' },
  imgOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: Spacing.sm },
  matchBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: Radius.full, marginBottom: 4 },
  matchText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  rName: { color: BrandColors.textPrimary, ...Typography.bodyBold, marginBottom: 2 },
  rMeta: { color: BrandColors.textSecondary, fontSize: 10 },
});
