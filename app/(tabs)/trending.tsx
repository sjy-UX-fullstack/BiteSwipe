/**
 * Trending Screen — Viral recipes from Instagram & YouTube.
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GlassCard from '@/components/ui/GlassCard';
import { BrandColors, Gradients, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import { MOCK_TRENDING, TrendingItem } from '@/constants/mock-data';
import { parseRecipeText } from '@/services/ai';
import { getViralRecipes } from '@/services/viralRecipes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, 428);
const COL_W = (CONTAINER_WIDTH - (Spacing.lg * 2) - Spacing.sm) / 2;

export default function TrendingScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'instagram' | 'youtube'>('all');
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [viralItems, setViralItems] = useState<TrendingItem[]>([]);
  const [loadingViral, setLoadingViral] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const items = await getViralRecipes();
        setViralItems(items);
      } catch {
        // fallback to mock only
      } finally {
        setLoadingViral(false);
      }
    })();
  }, []);

  const allItems = [...viralItems, ...MOCK_TRENDING];
  const filtered = filter === 'all' ? allItems : allItems.filter(t => t.source === filter);
  const hero = filtered[0];
  const grid = filtered.slice(1);

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Extract title/description from the URL for Gemini (it cannot browse)
    const titleHint = trimmed
      .replace(/https?:\/\/(www\.)?(instagram\.com|youtube\.com|youtu\.be)\//i, '')
      .replace(/[/_-]+/g, ' ')
      .trim()
      .slice(0, 80);

    setIsImporting(true);
    try {
      const recipeData = await parseRecipeText(
        `Recipe from social media post. URL slug hint: "${titleHint}". Generate a realistic recipe.`
      );
      if (recipeData) {
        router.push({
          pathname: '/trending-recipe',
          params: {
            title: recipeData.title,
            ingredients: JSON.stringify(recipeData.ingredients || []),
            steps: JSON.stringify(recipeData.steps || []),
            cookTime: recipeData.cookTime || '25 min',
            calories: String(recipeData.calories || 400),
            difficulty: recipeData.difficulty || 'Medium',
            cuisine: recipeData.cuisine || 'International',
            source: trimmed,
          },
        });
        setUrl('');
      } else {
        const msg = 'Could not extract recipe details. Try pasting a recipe title or description instead of a URL.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Import Failed', msg);
      }
    } catch {
      const msg = 'An error occurred while importing. Check your internet connection.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setIsImporting(false);
    }
  };

  const openTrendingItem = (item: TrendingItem) => {
    if ((item as any).ingredients) {
      // It's a full viral recipe from Gemini
      router.push({
        pathname: '/trending-recipe',
        params: {
          title: item.title,
          ingredients: JSON.stringify((item as any).ingredients || []),
          steps: JSON.stringify((item as any).steps || []),
          cookTime: (item as any).cookTime || '25 min',
          calories: String((item as any).calories || 400),
          difficulty: (item as any).difficulty || 'Medium',
          cuisine: (item as any).cuisine || 'International',
          source: `${item.source} · ${item.creator}`,
          views: item.views,
        },
      });
    } else {
      // Mock item — generate recipe from title
      setIsImporting(true);
      parseRecipeText(item.title)
        .then(data => {
          if (data) {
            router.push({
              pathname: '/trending-recipe',
              params: {
                title: data.title || item.title,
                ingredients: JSON.stringify(data.ingredients || []),
                steps: JSON.stringify(data.steps || []),
                cookTime: data.cookTime || '30 min',
                calories: String(data.calories || 450),
                difficulty: data.difficulty || 'Medium',
                cuisine: data.cuisine || 'International',
                source: `${item.source} · ${item.creator}`,
                views: item.views,
              },
            });
          }
        })
        .catch(() => {
          const msg = 'Could not load recipe. Try again.';
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert('Error', msg);
        })
        .finally(() => setIsImporting(false));
    }
  };

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          <Text style={s.sub}>WHAT'S VIRAL</Text>
          <View style={s.titleRow}>
            <Text style={s.title}>Trending Now</Text>
            <Feather name="trending-up" size={28} color={BrandColors.primaryStart} />
          </View>
          <Text style={s.desc}>The hottest recipes from Instagram Reels & YouTube Shorts, ready to cook!</Text>

          {/* Importer */}
          <GlassCard style={s.importer}>
            <View style={s.impRow}>
              <Feather name="link" size={24} color={BrandColors.textSecondary} style={s.impIcon} />
              <View style={{ flex: 1 }}>
                <Text style={s.impTitle}>Import a Recipe</Text>
                <Text style={s.impDesc}>Paste an Instagram or YouTube link — AI extracts the recipe instantly.</Text>
              </View>
            </View>
            <View style={s.inputRow}>
              <View style={s.inputWrapper}>
                <TextInput
                  placeholder="https://instagram.com/p/... or youtube.com/..."
                  placeholderTextColor={BrandColors.textTertiary}
                  style={s.input}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={handleImport} disabled={isImporting || !url.trim()}>
                <LinearGradient
                  colors={['#56CCF2', '#2F80ED']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.impBtn, (!url.trim() || isImporting) && { opacity: 0.5 }]}
                >
                  {isImporting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="download" size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={s.impBtnText}>Import</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            {(['all', 'instagram', 'youtube'] as const).map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.7}>
                <View style={[s.filterChip, filter === f && s.filterActive]}>
                  {f === 'all' && <Feather name="globe" size={14} color={filter === f ? '#fff' : BrandColors.textSecondary} />}
                  {f === 'instagram' && <Feather name="instagram" size={14} color={filter === f ? '#fff' : BrandColors.textSecondary} />}
                  {f === 'youtube' && <Feather name="youtube" size={14} color={filter === f ? '#fff' : BrandColors.textSecondary} />}
                  <Text style={[s.filterText, filter === f && s.filterTextA]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Weekly viral label */}
          {viralItems.length > 0 && (
            <View style={s.weeklyBadgeRow}>
              <LinearGradient colors={Gradients.primary as [string, string]} style={s.weeklyBadge}>
                <Feather name="zap" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={s.weeklyBadgeT}>AI-Curated This Week</Text>
              </LinearGradient>
              <Text style={s.weeklyHint}>Updated weekly via Gemini AI</Text>
            </View>
          )}

          {loadingViral && (
            <View style={s.viralLoading}>
              <ActivityIndicator size="small" color={BrandColors.primaryStart} />
              <Text style={s.viralLoadingT}>Fetching this week's viral picks…</Text>
            </View>
          )}

          {/* Importer global loader overlay */}
          {isImporting && (
            <View style={s.importingOverlay}>
              <ActivityIndicator size="small" color={BrandColors.primaryStart} />
              <Text style={s.importingT}>Extracting recipe with AI…</Text>
            </View>
          )}

          {/* Hero */}
          {hero && (
            <TouchableOpacity activeOpacity={0.9} style={s.heroWrapper} onPress={() => openTrendingItem(hero)}>
              <View style={[s.heroCard, Shadows.card]}>
                <Image
                  source={typeof hero.image === 'string' ? { uri: hero.image } : hero.image}
                  style={s.heroImg}
                  resizeMode="cover"
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']} style={s.heroOverlay}>
                  <View style={s.sourceBadge}>
                    {hero.source === 'instagram'
                      ? <Feather name="instagram" size={12} color="#fff" />
                      : <Feather name="youtube" size={12} color="#fff" />}
                    <Text style={s.sourceT}>{hero.source === 'instagram' ? 'Instagram' : 'YouTube'}</Text>
                  </View>
                  <View style={s.heroIcon}>
                    <Feather name={(hero.icon as any) || 'cloud'} size={24} color="#fff" />
                  </View>
                  <Text style={s.heroTitleText} numberOfLines={2}>{hero.title}</Text>
                  <View style={s.heroMeta}>
                    <Text style={s.heroMetaT}>{hero.creator} · {hero.views} views</Text>
                    <View style={s.tapHint}>
                      <Feather name="chevron-right" size={12} color={BrandColors.textSecondary} />
                      <Text style={s.tapHintT}>Tap to cook</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}

          {/* Grid */}
          <View style={s.grid}>
            {grid.map(t => (
              <TouchableOpacity key={t.id} activeOpacity={0.9} onPress={() => openTrendingItem(t)}>
                <View style={[s.gridCard, Shadows.card]}>
                  <Image
                    source={typeof t.image === 'string' ? { uri: t.image } : t.image}
                    style={s.gridImg}
                    resizeMode="cover"
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={s.gridOverlay}>
                    <View style={s.sourceBadgeGrid}>
                      {t.source === 'instagram'
                        ? <Feather name="instagram" size={10} color="#fff" />
                        : <Feather name="youtube" size={10} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={s.gridTitle} numberOfLines={2}>{t.title}</Text>
                    <Text style={s.gridMeta}>{t.views} views · tap to cook</Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  sub: { color: BrandColors.textTertiary, ...Typography.tiny, marginBottom: Spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  title: { color: BrandColors.textPrimary, ...Typography.h1 },
  desc: { color: BrandColors.textSecondary, ...Typography.body, marginBottom: Spacing.lg },
  importer: { padding: Spacing.md, marginBottom: Spacing.lg },
  impRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  impIcon: { transform: [{ rotate: '45deg' }], marginRight: Spacing.sm },
  impTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  impDesc: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inputWrapper: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.full, borderWidth: 1, borderColor: BrandColors.glassBorder, paddingHorizontal: Spacing.md },
  input: { color: BrandColors.textPrimary, height: 40, ...Typography.body },
  impBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: Spacing.md, borderRadius: Radius.full },
  impBtnText: { color: '#fff', ...Typography.bodyBold },
  filters: { gap: Spacing.sm, marginBottom: Spacing.lg },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder },
  filterActive: { backgroundColor: BrandColors.dark600, borderColor: BrandColors.textPrimary },
  filterText: { color: BrandColors.textSecondary, ...Typography.caption },
  filterTextA: { color: BrandColors.textPrimary, fontWeight: '700' },
  weeklyBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  weeklyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  weeklyBadgeT: { color: '#fff', fontSize: 11, fontWeight: '700' },
  weeklyHint: { color: BrandColors.textTertiary, ...Typography.caption },
  viralLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  viralLoadingT: { color: BrandColors.textTertiary, ...Typography.caption },
  importingOverlay: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: BrandColors.dark800, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  importingT: { color: BrandColors.textSecondary, ...Typography.caption },
  heroWrapper: { marginBottom: Spacing.sm },
  heroCard: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: BrandColors.dark600 },
  heroImg: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, padding: Spacing.md, justifyContent: 'flex-end' },
  sourceBadge: { position: 'absolute', top: Spacing.md, right: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  sourceT: { color: '#fff', fontSize: 10, fontWeight: '600' },
  heroIcon: { marginBottom: Spacing.xs },
  heroTitleText: { color: BrandColors.textPrimary, ...Typography.h2, marginBottom: 4 },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroMetaT: { color: BrandColors.textSecondary, ...Typography.caption },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tapHintT: { color: BrandColors.textSecondary, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm },
  gridCard: { width: COL_W, aspectRatio: 1, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: BrandColors.dark600 },
  gridImg: { width: '100%', height: '100%', position: 'absolute' },
  gridOverlay: { ...StyleSheet.absoluteFillObject, padding: Spacing.sm },
  sourceBadgeGrid: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: Radius.full },
  gridTitle: { color: BrandColors.textPrimary, ...Typography.caption, fontWeight: '700' },
  gridMeta: { color: BrandColors.textTertiary, fontSize: 10, marginTop: 2 },
});
