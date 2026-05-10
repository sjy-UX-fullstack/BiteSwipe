/**
 * Search tab — type any dish and BiteSwipe AI generates a full recipe.
 * Powered by Groq via /api/recipe-by-name. Renders results on /ai-recipe.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Keyboard, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { searchRecipeByName } from '@/services/ai';
import { getPrefs } from '@/services/userPrefs';

const RECENT_KEY = 'biteswipe_recent_searches';
const MAX_RECENT = 8;

const SUGGESTIONS = [
  { label: 'Chicken Biryani', icon: 'star' },
  { label: 'Pad Thai', icon: 'star' },
  { label: 'Margherita Pizza', icon: 'star' },
  { label: 'Butter Chicken', icon: 'star' },
  { label: 'Pasta Carbonara', icon: 'star' },
  { label: 'Sushi Rolls', icon: 'star' },
  { label: 'Tacos', icon: 'star' },
  { label: 'Ramen', icon: 'star' },
  { label: 'Tikka Masala', icon: 'star' },
  { label: 'Greek Salad', icon: 'star' },
  { label: 'Pancakes', icon: 'star' },
  { label: 'Khichdi', icon: 'star' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const loadRecent = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);
  useFocusEffect(useCallback(() => { loadRecent(); }, [loadRecent]));

  const persistRecent = async (next: string[]) => {
    setRecent(next);
    try { await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const clearRecent = async () => {
    setRecent([]);
    try { await AsyncStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  };

  const submit = async (rawQuery?: string) => {
    const q = (rawQuery ?? query).trim();
    if (!q || busy) return;
    Keyboard.dismiss();
    setBusy(true);
    try {
      const prefs = await getPrefs();
      const recipe = await searchRecipeByName(
        q,
        prefs.dietPreference ?? 'non-veg',
        prefs.allergens ?? [],
      );
      if (!recipe) {
        const msg = `Couldn't find a recipe for "${q}". Try a different name.`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('No recipe found', msg);
        return;
      }
      // Update recent list (move-to-front, dedupe).
      const next = [q, ...recent.filter(r => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
      persistRecent(next);
      router.push({
        pathname: '/ai-recipe' as any,
        params: { recipe: JSON.stringify(recipe) },
      });
      setQuery('');
    } catch (e: any) {
      const msg = e?.message ?? 'Search failed';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setBusy(false);
    }
  };

  const removeRecent = (item: string) => {
    persistRecent(recent.filter(r => r !== item));
  };

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Search</Text>
            <Text style={s.subtitle}>Get any recipe instantly with BiteSwipe AI</Text>
          </View>

          {/* Search bar */}
          <View style={s.searchBarWrap}>
            <View style={s.searchBar}>
              <Feather name="search" size={20} color={BrandColors.textTertiary} />
              <TextInput
                style={s.input}
                placeholder="What do you want to cook?"
                placeholderTextColor={BrandColors.textTertiary}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => submit()}
                returnKeyType="search"
                autoCapitalize="words"
                editable={!busy}
              />
              {query.length > 0 && !busy && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Feather name="x" size={18} color={BrandColors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={busy || query.trim().length === 0}
              onPress={() => submit()}
              style={{ marginTop: Spacing.sm }}
            >
              <LinearGradient
                colors={
                  (busy || query.trim().length === 0
                    ? ['#444', '#666']
                    : Gradients.primary) as [string, string]
                }
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.searchBtn}
              >
                {busy ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                    <Text style={s.searchBtnT}>Cooking up your recipe…</Text>
                  </>
                ) : (
                  <>
                    <Feather name="zap" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={s.searchBtnT}>Get recipe</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Recent searches */}
          {recent.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={s.sectionTitleRow}>
                  <Feather name="clock" size={16} color={BrandColors.textSecondary} />
                  <Text style={s.sectionTitle}>Recent</Text>
                </View>
                <TouchableOpacity onPress={clearRecent} hitSlop={8}>
                  <Text style={s.clearLink}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={s.recentList}>
                {recent.map(item => (
                  <View key={item} style={s.recentRow}>
                    <TouchableOpacity
                      style={s.recentTextWrap}
                      activeOpacity={0.7}
                      onPress={() => submit(item)}
                      disabled={busy}
                    >
                      <Feather name="search" size={14} color={BrandColors.textTertiary} />
                      <Text style={s.recentT}>{item}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeRecent(item)}
                      hitSlop={8}
                    >
                      <Feather name="x" size={16} color={BrandColors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Popular suggestions */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionTitleRow}>
                <Feather name="star" size={16} color={BrandColors.primaryStart} />
                <Text style={s.sectionTitle}>Popular searches</Text>
              </View>
            </View>
            <View style={s.chipsWrap}>
              {SUGGESTIONS.map(sug => (
                <TouchableOpacity
                  key={sug.label}
                  style={s.suggestChip}
                  activeOpacity={0.75}
                  onPress={() => submit(sug.label)}
                  disabled={busy}
                >
                  <Text style={s.suggestChipT}>{sug.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tip card */}
          <View style={s.tipCard}>
            <Feather name="zap" size={16} color={BrandColors.accent} style={{ marginRight: 8 }} />
            <Text style={s.tipT}>
              Tip: be specific — "chicken tikka masala" beats "chicken curry" for sharper results.
            </Text>
          </View>

          <View style={{ height: 100 }} />
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
  searchBarWrap: { marginBottom: Spacing.xl },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: BrandColors.dark800,
    borderWidth: 1,
    borderColor: BrandColors.glassBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  input: { flex: 1, color: BrandColors.textPrimary, fontSize: 16, paddingVertical: 0 },
  searchBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  searchBtnT: { color: '#fff', ...Typography.bodyBold, fontSize: 15 },
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sectionTitle: { color: BrandColors.textPrimary, ...Typography.h3 },
  clearLink: { color: BrandColors.primaryStart, ...Typography.caption, fontWeight: '700' },
  recentList: { gap: Spacing.xs },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.dark800,
    borderWidth: 1,
    borderColor: BrandColors.glassBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  recentTextWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  recentT: { color: BrandColors.textPrimary, ...Typography.body },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  suggestChip: {
    backgroundColor: BrandColors.glass,
    borderWidth: 1,
    borderColor: BrandColors.glassBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  suggestChipT: { color: BrandColors.textPrimary, ...Typography.caption, fontWeight: '600' },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,209,102,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.25)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  tipT: { flex: 1, color: BrandColors.accent, ...Typography.caption },
});
