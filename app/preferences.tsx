/**
 * Preferences — dietary preference + allergens, persisted in Firestore.
 * BiteSwipe AI honors these on every recipe generation.
 */
import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import {
  getPrefs, savePrefs, ALLERGEN_OPTIONS, type Allergen,
} from '@/services/userPrefs';
import type { DietPreference } from '@/services/ai';

const DIET_OPTS: { value: DietPreference; label: string; icon: any }[] = [
  { value: 'veg', label: 'Vegetarian', icon: 'feather' },
  { value: 'non-veg', label: 'Non-Veg', icon: 'award' },
  { value: 'vegan', label: 'Vegan', icon: 'sun' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const [diet, setDiet] = useState<DietPreference | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getPrefs();
      setDiet(p.dietPreference);
      setAllergens(p.allergens);
      setLoading(false);
    })();
  }, []);

  const toggleAllergen = (a: Allergen) =>
    setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePrefs({ dietPreference: diet, allergens });
      const msg = 'Preferences saved.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Saved', msg);
      router.back();
    } catch (e: any) {
      const msg = e?.message ?? 'Could not save.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={BrandColors.primaryStart} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.title}>Preferences</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Text style={s.sectionTitle}>Dietary preference</Text>
          <Text style={s.sectionDesc}>BiteSwipe AI strictly honors this on every recipe.</Text>
          <View style={s.dietRow}>
            {DIET_OPTS.map(opt => {
              const active = diet === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setDiet(opt.value)}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  {active ? (
                    <LinearGradient colors={Gradients.primary as [string, string]} style={s.dietChipActive}>
                      <Feather name={opt.icon} size={16} color="#fff" />
                      <Text style={s.dietChipTActive}>{opt.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={s.dietChip}>
                      <Feather name={opt.icon} size={16} color={BrandColors.textSecondary} />
                      <Text style={s.dietChipT}>{opt.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.sectionTitle, { marginTop: Spacing.xl }]}>Allergens to avoid</Text>
          <Text style={s.sectionDesc}>Recipes containing these ingredients will be skipped.</Text>
          <View style={s.allergenGrid}>
            {ALLERGEN_OPTIONS.map(opt => {
              const active = allergens.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => toggleAllergen(opt.value)}
                  activeOpacity={0.8}
                  style={[s.allergenChip, active && s.allergenChipActive]}
                >
                  <Feather
                    name={active ? 'check' : 'plus'}
                    size={14}
                    color={active ? '#fff' : BrandColors.textTertiary}
                  />
                  <Text style={[s.allergenT, active && s.allergenTActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtn}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.saveBtnT}>Save preferences</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  title: { color: BrandColors.textPrimary, ...Typography.h2 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl },
  sectionTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold, marginBottom: 2 },
  sectionDesc: { color: BrandColors.textTertiary, ...Typography.caption, marginBottom: Spacing.md },
  dietRow: { flexDirection: 'row', gap: Spacing.sm },
  dietChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: Radius.full, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder },
  dietChipT: { color: BrandColors.textSecondary, ...Typography.caption, fontWeight: '700' },
  dietChipActive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: Radius.full },
  dietChipTActive: { color: '#fff', ...Typography.caption, fontWeight: '800' },
  allergenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder },
  allergenChipActive: { backgroundColor: BrandColors.primaryStart, borderColor: BrandColors.primaryStart },
  allergenT: { color: BrandColors.textSecondary, fontSize: 13, fontWeight: '600' },
  allergenTActive: { color: '#fff', fontWeight: '700' },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: BrandColors.glassBorder, backgroundColor: BrandColors.dark900 },
  saveBtn: { paddingVertical: Spacing.md, borderRadius: Radius.full, alignItems: 'center' },
  saveBtnT: { color: '#fff', ...Typography.bodyBold, fontSize: 16 },
});
