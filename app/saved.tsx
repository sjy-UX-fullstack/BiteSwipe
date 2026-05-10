/**
 * Saved Recipes — dedicated page listing every bookmarked recipe.
 * AI recipes route to /ai-recipe; mock recipes route to /modal.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/components/ui/GlassCard';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { listSavedRecipes, unsaveRecipe, type SavedRecipe } from '@/services/savedRecipes';

export default function SavedScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const items = await listSavedRecipes();
    setRecipes(items);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleOpen = (r: SavedRecipe) => {
    if (r.source === 'ai') {
      router.push({ pathname: '/ai-recipe' as any, params: { recipe: JSON.stringify(r) } });
    } else {
      router.push({ pathname: '/modal', params: { id: r.id } });
    }
  };

  const handleRemove = (r: SavedRecipe) => {
    const doRemove = async () => {
      await unsaveRecipe(r.id);
      setRecipes(prev => prev.filter(x => x.id !== r.id));
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${r.title}" from saved?`)) doRemove();
    } else {
      Alert.alert('Remove', `Remove "${r.title}" from saved?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.title}>Saved Recipes</Text>
          <View style={s.countPill}>
            <Text style={s.countT}>{recipes.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={BrandColors.primaryStart} />
          </View>
        ) : recipes.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Feather name="bookmark" size={36} color={BrandColors.textTertiary} />
            </View>
            <Text style={s.emptyTitle}>No saved recipes yet</Text>
            <Text style={s.emptyDesc}>
              Tap the bookmark icon on any recipe to save it here for later.
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.85} style={{ marginTop: Spacing.lg }}>
              <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
                <Text style={s.ctaT}>Browse recipes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
            {recipes.map(r => (
              <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => handleOpen(r)}>
                <GlassCard style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={s.sourceBadge}>
                        <Feather
                          name={r.source === 'ai' ? 'zap' : 'book-open'}
                          size={10}
                          color={BrandColors.primaryStart}
                        />
                        <Text style={s.sourceT}>
                          {r.source === 'ai' ? 'BiteSwipe AI' : 'Recipe'}
                        </Text>
                      </View>
                      <Text style={s.cardTitle} numberOfLines={2}>{r.title}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemove(r)} hitSlop={10} style={s.removeBtn}>
                      <Feather name="x" size={16} color={BrandColors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.cardMeta}>
                    {[r.cuisine, r.cookTime, r.calories ? `${r.calories} cal` : null, r.difficulty]
                      .filter(Boolean).join(' · ')}
                  </Text>
                  {Array.isArray(r.tags) && r.tags.length > 0 && (
                    <View style={s.tagRow}>
                      {r.tags.slice(0, 3).map((t, i) => (
                        <View key={i} style={s.tag}><Text style={s.tagT}>{t}</Text></View>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            ))}
            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: BrandColors.textPrimary, ...Typography.h2 },
  countPill: { backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  countT: { color: BrandColors.primaryStart, ...Typography.caption, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, gap: Spacing.sm },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: BrandColors.dark800, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emptyTitle: { color: BrandColors.textPrimary, ...Typography.h3, textAlign: 'center' },
  emptyDesc: { color: BrandColors.textSecondary, ...Typography.body, textAlign: 'center' },
  cta: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  ctaT: { color: '#fff', ...Typography.bodyBold },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  card: { padding: Spacing.md, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 4 },
  sourceT: { color: BrandColors.primaryStart, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  cardTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 16 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: BrandColors.dark600, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  tag: { backgroundColor: BrandColors.dark600, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  tagT: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '700' },
});
