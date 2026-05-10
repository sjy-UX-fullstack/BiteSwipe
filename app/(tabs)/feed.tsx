/**
 * For You — personalized recipe feed driven by the user's own data:
 *   • Cook Again       — deduped recent cookHistory
 *   • From Your Fridge — Groq-generated recipes from current pantry (cached daily)
 *   • Try Something New — curated dishes filtered by cuisine affinity
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import {
  getCookAgainPicks, getDiscoveryPicks, getPantryReadyPicks,
  type CookAgainItem,
} from '@/services/forYou';
import type { AIRecipe } from '@/services/ai';
import { searchRecipeByName } from '@/services/ai';
import { getPrefs } from '@/services/userPrefs';

interface DiscoverySection { cuisine: string; dishes: string[] }

export default function ForYouScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cookAgain, setCookAgain] = useState<CookAgainItem[]>([]);
  const [pantry, setPantry] = useState<{ recipes: AIRecipe[]; pantrySize: number; fromCache: boolean }>({
    recipes: [], pantrySize: 0, fromCache: false,
  });
  const [pantryBusy, setPantryBusy] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoverySection[]>([]);
  const [dishBusy, setDishBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [cooked, pant, disco] = await Promise.all([
      getCookAgainPicks(),
      getPantryReadyPicks(false),
      getDiscoveryPicks(),
    ]);
    setCookAgain(cooked);
    setPantry(pant);
    setDiscovery(disco);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const refetchPantry = async () => {
    setPantryBusy(true);
    try {
      const pant = await getPantryReadyPicks(true);
      setPantry(pant);
    } finally {
      setPantryBusy(false);
    }
  };

  const openCookAgain = (item: CookAgainItem) => {
    if (item.source === 'mock' && item.recipeId) {
      router.push({ pathname: '/modal', params: { id: item.recipeId } });
    } else {
      router.push('/saved' as any);
    }
  };

  const openAIRecipe = (recipe: AIRecipe) => {
    router.push({ pathname: '/ai-recipe' as any, params: { recipe: JSON.stringify(recipe) } });
  };

  const generateDish = async (name: string) => {
    if (dishBusy) return;
    setDishBusy(name);
    try {
      const prefs = await getPrefs();
      const recipe = await searchRecipeByName(name, prefs.dietPreference ?? 'non-veg', prefs.allergens ?? []);
      if (!recipe) {
        const msg = `Couldn't generate "${name}". Try again.`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('No recipe', msg);
        return;
      }
      router.push({ pathname: '/ai-recipe' as any, params: { recipe: JSON.stringify(recipe) } });
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to generate recipe';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setDishBusy(null);
    }
  };

  const hasAnything =
    cookAgain.length > 0 ||
    pantry.recipes.length > 0 ||
    pantry.pantrySize > 0 ||
    discovery.length > 0;

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>For You</Text>
            <Text style={s.subtitle}>Picks based on what you cook, save, and have on hand</Text>
          </View>

          {loading ? (
            <View style={s.center}>
              <ActivityIndicator color={BrandColors.primaryStart} />
            </View>
          ) : !hasAnything ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Feather name="compass" size={36} color={BrandColors.textTertiary} />
              </View>
              <Text style={s.emptyTitle}>Your feed is warming up</Text>
              <Text style={s.emptyDesc}>
                Scan your fridge, save a few recipes, or cook one — and your personal picks will show up here.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/scan' as any)}
                activeOpacity={0.85}
                style={{ marginTop: Spacing.lg }}
              >
                <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
                  <Feather name="camera" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={s.ctaT}>Scan your fridge</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Cook Again */}
              {cookAgain.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <View style={s.sectionTitleRow}>
                      <Feather name="repeat" size={18} color={BrandColors.primaryStart} />
                      <Text style={s.sectionTitle}>Cook Again</Text>
                    </View>
                    <Text style={s.sectionSub}>{cookAgain.length}</Text>
                  </View>
                  <ScrollView
                    horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.hRow}
                  >
                    {cookAgain.map((item, i) => (
                      <TouchableOpacity
                        key={`${item.recipeId ?? item.title}-${i}`}
                        activeOpacity={0.85}
                        onPress={() => openCookAgain(item)}
                        style={s.repeatCard}
                      >
                        <View style={s.repeatIcon}>
                          <Feather name="check-circle" size={22} color={BrandColors.success} />
                        </View>
                        <Text style={s.repeatTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={s.repeatSub}>
                          {item.source === 'ai' ? 'BiteSwipe AI' : 'Recipe'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* From Your Fridge */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionTitleRow}>
                    <Feather name="package" size={18} color={BrandColors.primaryStart} />
                    <Text style={s.sectionTitle}>From Your Fridge</Text>
                  </View>
                  {pantry.pantrySize > 0 && (
                    <TouchableOpacity onPress={refetchPantry} disabled={pantryBusy} hitSlop={8}>
                      {pantryBusy
                        ? <ActivityIndicator size="small" color={BrandColors.primaryStart} />
                        : <Feather name="refresh-cw" size={16} color={BrandColors.primaryStart} />}
                    </TouchableOpacity>
                  )}
                </View>

                {pantry.pantrySize === 0 ? (
                  <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/scan' as any)}
                    activeOpacity={0.8}
                    style={s.pantryEmptyCard}
                  >
                    <Feather name="camera" size={20} color={BrandColors.primaryStart} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.pantryEmptyT}>Scan your fridge to unlock recipes</Text>
                      <Text style={s.pantryEmptySub}>We'll suggest meals based on what's actually there.</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={BrandColors.textTertiary} />
                  </TouchableOpacity>
                ) : pantry.recipes.length === 0 ? (
                  <View style={s.pantryEmptyCard}>
                    <Feather name="package" size={20} color={BrandColors.textTertiary} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.pantryEmptyT}>{pantry.pantrySize} items in your pantry</Text>
                      <Text style={s.pantryEmptySub}>Tap refresh to generate recipes from them.</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={s.pantryHint}>
                      Generated from {pantry.pantrySize} pantry items{pantry.fromCache ? ' · cached' : ''}
                    </Text>
                    <View style={s.pantryList}>
                      {pantry.recipes.map((r, i) => (
                        <TouchableOpacity
                          key={r.id ?? `pantry_${i}`}
                          activeOpacity={0.85}
                          onPress={() => openAIRecipe(r)}
                          style={s.pantryCard}
                        >
                          <View style={s.pantryBadge}>
                            <Feather name="zap" size={10} color="#fff" />
                            <Text style={s.pantryBadgeT}>AI</Text>
                          </View>
                          <Text style={s.pantryCardT} numberOfLines={2}>{r.title}</Text>
                          <Text style={s.pantryCardSub}>
                            {[r.cuisine, r.cookTime, r.calories ? `${r.calories} cal` : null].filter(Boolean).join(' · ')}
                          </Text>
                          {typeof r.matchPercentage === 'number' && (
                            <View style={s.matchPill}>
                              <Text style={s.matchPillT}>{r.matchPercentage}% match</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Try Something New */}
              {discovery.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <View style={s.sectionTitleRow}>
                      <Feather name="compass" size={18} color={BrandColors.primaryStart} />
                      <Text style={s.sectionTitle}>Try Something New</Text>
                    </View>
                  </View>
                  <Text style={s.discoSub}>
                    Inspired by cuisines you've saved
                  </Text>
                  {discovery.map(group => (
                    <View key={group.cuisine} style={s.cuisineGroup}>
                      <Text style={s.cuisineLabel}>{group.cuisine}</Text>
                      <View style={s.dishWrap}>
                        {group.dishes.map(dish => {
                          const busy = dishBusy === dish;
                          return (
                            <TouchableOpacity
                              key={dish}
                              onPress={() => generateDish(dish)}
                              disabled={dishBusy !== null}
                              activeOpacity={0.75}
                              style={[s.dishChip, busy && s.dishChipBusy]}
                            >
                              {busy ? (
                                <ActivityIndicator size="small" color={BrandColors.primaryStart} />
                              ) : (
                                <Feather name="plus" size={12} color={BrandColors.primaryStart} />
                              )}
                              <Text style={s.dishChipT}>{dish}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  header: { marginBottom: Spacing.lg },
  title: { color: BrandColors.textPrimary, ...Typography.hero, marginBottom: 4 },
  subtitle: { color: BrandColors.textSecondary, ...Typography.body },
  center: { paddingTop: 80, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  emptyIcon: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: BrandColors.dark800,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { color: BrandColors.textPrimary, ...Typography.h3, textAlign: 'center' },
  emptyDesc: { color: BrandColors.textSecondary, ...Typography.body, textAlign: 'center' },
  cta: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  ctaT: { color: '#fff', ...Typography.bodyBold },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sectionTitle: { color: BrandColors.textPrimary, ...Typography.h3 },
  sectionSub: { color: BrandColors.textTertiary, ...Typography.caption, fontWeight: '700' },

  // Cook Again cards
  hRow: { gap: Spacing.sm, paddingRight: Spacing.lg },
  repeatCard: {
    width: 160, padding: Spacing.md,
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  repeatIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(52,199,89,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  repeatTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 14 },
  repeatSub: { color: BrandColors.textTertiary, fontSize: 11, fontWeight: '600' },

  // Pantry section
  pantryEmptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  pantryEmptyT: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 14 },
  pantryEmptySub: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 2 },
  pantryHint: { color: BrandColors.textTertiary, ...Typography.caption, marginBottom: Spacing.sm },
  pantryList: { gap: Spacing.sm },
  pantryCard: {
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  pantryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.primaryStart,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: 4,
  },
  pantryBadgeT: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  pantryCardT: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 15 },
  pantryCardSub: { color: BrandColors.textTertiary, ...Typography.caption },
  matchPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderWidth: 1, borderColor: 'rgba(52,199,89,0.4)',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  matchPillT: { color: BrandColors.success, fontSize: 10, fontWeight: '800' },

  // Discovery
  discoSub: { color: BrandColors.textTertiary, ...Typography.caption, marginBottom: Spacing.md },
  cuisineGroup: { marginBottom: Spacing.md },
  cuisineLabel: {
    color: BrandColors.textSecondary,
    fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  dishWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  dishChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  dishChipBusy: { opacity: 0.7 },
  dishChipT: { color: BrandColors.primaryStart, ...Typography.caption, fontWeight: '700' },
});
