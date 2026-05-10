/**
 * Home Screen — BiteSwipe landing page.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import GlassCard from '@/components/ui/GlassCard';
import { BrandColors, Gradients, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import { MOCK_RECIPES, MEAL_CATEGORIES } from '@/constants/mock-data';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_WIDTH - 40, 428 - 40) * 0.72;

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const greeting = getGreeting();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.greetingRow}>
                <Text style={styles.greeting}>{greeting.label}</Text>
                <Feather name={greeting.icon as any} size={14} color={BrandColors.textSecondary} />
              </View>
              <Text style={styles.heroTitle}>
                What's cooking{'\n'}
                <Text style={styles.heroAccent}>today?</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => router.push('/shopping-list' as any)}
                style={styles.headerIconBtn}
                hitSlop={8}
              >
                <Feather name="shopping-cart" size={18} color={BrandColors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/saved' as any)}
                style={styles.headerIconBtn}
                hitSlop={8}
              >
                <Feather name="bookmark" size={20} color={BrandColors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
                <LinearGradient colors={Gradients.primary as [string, string]} style={styles.avatarGradient}>
                  <Feather name="user" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <GlassCard style={styles.quickAction}>
              <TouchableOpacity style={styles.quickActionInner} onPress={() => router.push('/scan')}>
                <Feather name="camera" size={24} color={BrandColors.textPrimary} />
                <Text style={styles.quickLabel}>Scan{'\n'}Fridge</Text>
              </TouchableOpacity>
            </GlassCard>
            <GlassCard style={styles.quickAction}>
              <TouchableOpacity style={styles.quickActionInner} onPress={() => router.push('/swipe')}>
                <Feather name="zap" size={24} color={BrandColors.textPrimary} />
                <Text style={styles.quickLabel}>Swipe{'\n'}Recipes</Text>
              </TouchableOpacity>
            </GlassCard>
            <GlassCard style={styles.quickAction}>
              <TouchableOpacity style={styles.quickActionInner} onPress={() => router.push('/scan')}>
                <Feather name="refresh-cw" size={24} color={BrandColors.textPrimary} />
                <Text style={styles.quickLabel}>Remix{'\n'}My Fridge</Text>
              </TouchableOpacity>
            </GlassCard>
            <GlassCard style={styles.quickAction}>
              <TouchableOpacity style={styles.quickActionInner} onPress={() => router.push('/search' as any)}>
                <Feather name="search" size={24} color={BrandColors.textPrimary} />
                <Text style={styles.quickLabel}>Search{'\n'}Recipe</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {MEAL_CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)} activeOpacity={0.7}>
                {selectedCategory === cat.id ? (
                  <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chip}>
                    <Feather name={cat.icon as any} size={16} color="#fff" />
                    <Text style={styles.chipTextActive}>{cat.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.chip, styles.chipInactive]}>
                    <Feather name={cat.icon as any} size={16} color={BrandColors.textSecondary} />
                    <Text style={styles.chipText}>{cat.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Today's Picks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="star" size={20} color={BrandColors.primaryStart} />
                <Text style={styles.sectionTitle}>Today's Picks</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/see-all')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recipeRow} decelerationRate="fast" snapToInterval={CARD_W + Spacing.sm}>
              {MOCK_RECIPES.filter(r => selectedCategory === 'all' || r.category === selectedCategory).map((recipe) => (
                <TouchableOpacity key={recipe.id} activeOpacity={0.9} onPress={() => router.push({ pathname: '/modal', params: { id: recipe.id } })}>
                  <View style={[styles.recipeCard, Shadows.card]}>
                    <Image source={typeof recipe.image === 'string' ? { uri: recipe.image } : recipe.image} style={styles.recipeImage} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.recipeOverlay}>
                      <View style={styles.recipeCardContent}>
                        <View style={styles.miniIcon}>
                           <Feather name={recipe.icon as any || 'coffee'} size={20} color="#fff" />
                        </View>
                        <Text style={styles.recipeName} numberOfLines={2}>{recipe.title}</Text>
                        <View style={styles.recipeMeta}>
                          <View style={styles.metaItem}>
                            <Feather name="clock" size={12} color={BrandColors.textSecondary} />
                            <Text style={styles.recipeMetaText}>{recipe.cookTime}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Feather name="zap" size={12} color={BrandColors.textSecondary} />
                            <Text style={styles.recipeMetaText}>{recipe.calories} cal</Text>
                          </View>
                        </View>
                        {recipe.matchPercentage && (
                          <View style={styles.miniMatch}>
                            <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.miniMatchGradient}>
                              <Text style={styles.miniMatchText}>{recipe.matchPercentage}% Match</Text>
                            </LinearGradient>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Jedi Mode Banner */}
          <GlassCard style={styles.jediBanner} intensity="heavy">
            <View style={styles.jediContent}>
              <View style={styles.jediIconWrap}>
                 <Feather name="move" size={28} color={BrandColors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.jediTitle}>Jedi Mode</Text>
                <Text style={styles.jediDesc}>Navigate recipes hands-free with air gestures while cooking!</Text>
              </View>
              <View style={styles.jediTag}>
                <Text style={styles.jediTagText}>COMING SOON</Text>
              </View>
            </View>
          </GlassCard>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { label: 'Good morning', icon: 'sunrise' };
  if (hour < 17) return { label: 'Good afternoon', icon: 'sun' };
  return { label: 'Good evening', icon: 'moon' };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs, marginBottom: Spacing.xxs },
  greeting: { color: BrandColors.textSecondary, ...Typography.caption },
  heroTitle: { color: BrandColors.textPrimary, ...Typography.hero },
  heroAccent: { color: BrandColors.primaryStart },
  avatar: { marginTop: Spacing.xxs },
  avatarGradient: { width: 48, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickAction: { flex: 1, padding: Spacing.sm },
  quickActionInner: { alignItems: 'center', gap: Spacing.xs },
  quickLabel: { color: BrandColors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  categoryRow: { gap: Spacing.xs, paddingBottom: Spacing.lg, paddingRight: Spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  chipInactive: { backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder },
  chipText: { color: BrandColors.textSecondary, ...Typography.caption },
  chipTextActive: { color: BrandColors.textPrimary, ...Typography.caption, fontWeight: '700' },
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sectionTitle: { color: BrandColors.textPrimary, ...Typography.h3 },
  seeAll: { color: BrandColors.primaryStart, ...Typography.caption, fontWeight: '600' },
  recipeRow: { gap: Spacing.sm },
  recipeCard: { width: CARD_W, height: CARD_W * 1.05, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: BrandColors.dark600 },
  recipeImage: { width: '100%', height: '100%', position: 'absolute', borderRadius: Radius.xl },
  recipeOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: Spacing.md },
  recipeCardContent: { gap: Spacing.xxs },
  miniIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxs },
  recipeName: { color: BrandColors.textPrimary, ...Typography.h3 },
  recipeMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xxs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeMetaText: { color: BrandColors.textSecondary, ...Typography.caption },
  miniMatch: { alignSelf: 'flex-start', marginTop: Spacing.xs },
  miniMatchGradient: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  miniMatchText: { color: BrandColors.textPrimary, fontSize: 11, fontWeight: '700' },
  jediBanner: { marginTop: Spacing.sm },
  jediContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  jediIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 209, 102, 0.1)', alignItems: 'center', justifyContent: 'center' },
  jediTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold, marginBottom: 2 },
  jediDesc: { color: BrandColors.textTertiary, ...Typography.caption },
  jediTag: { backgroundColor: BrandColors.dark500, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs, borderRadius: Radius.full },
  jediTagText: { color: BrandColors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
});
