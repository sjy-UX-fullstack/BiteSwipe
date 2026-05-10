/**
 * Onboarding — runs once after signup (or for any signed-in user whose
 * onboardingComplete flag is false). Two short steps + skip option:
 *   1. Diet preference + allergens (powers all AI recipe gen)
 *   2. Who they're cooking for (defaults serving sizes)
 *
 * Both steps are skippable; flag persists either way so it doesn't loop.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import {
  ALLERGEN_OPTIONS, COOKING_FOR_OPTIONS, savePrefs,
  type Allergen, type CookingFor,
} from '@/services/userPrefs';
import type { DietPreference } from '@/services/ai';
import { useAuth } from '@/hooks/useAuth';

const DIET_OPTS: { value: DietPreference; label: string; sub: string; icon: any }[] = [
  { value: 'veg', label: 'Vegetarian', sub: 'No meat, fish, seafood', icon: 'feather' },
  { value: 'non-veg', label: 'Non-Veg', sub: 'Meat, fish, eggs, dairy', icon: 'award' },
  { value: 'vegan', label: 'Vegan', sub: 'No animal products', icon: 'sun' },
];

const TOTAL_STEPS = 2;

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [diet, setDiet] = useState<DietPreference | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [cookingFor, setCookingFor] = useState<CookingFor | null>(null);
  const [busy, setBusy] = useState(false);

  const greetingName = user?.displayName?.split(' ')[0] ?? 'Chef';

  const toggleAllergen = (a: Allergen) =>
    setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const persist = async (overrides: Partial<{ onboardingComplete: boolean }> = {}) => {
    setBusy(true);
    try {
      await savePrefs({
        dietPreference: diet,
        allergens,
        cookingFor,
        onboardingComplete: true,
        ...overrides,
      });
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      const msg = e?.message ?? 'Could not save your preferences.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => persist();
  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else persist();
  };
  const handleBack = () => step > 0 && setStep(step - 1);

  const canContinueStep1 = diet !== null;
  const canContinueStep2 = cookingFor !== null;
  const canContinue = step === 0 ? canContinueStep1 : canContinueStep2;

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Top bar: progress + skip */}
        <View style={s.topBar}>
          <View style={s.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[s.progressDot, i <= step && s.progressDotActive]}
              />
            ))}
          </View>
          <TouchableOpacity onPress={handleSkip} disabled={busy} hitSlop={8}>
            <Text style={s.skipT}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {step === 0 ? (
            <>
              <Text style={s.kicker}>Welcome, {greetingName}</Text>
              <Text style={s.title}>What's your kitchen like?</Text>
              <Text style={s.subtitle}>
                We'll honor this on every AI recipe — pick what fits you best.
              </Text>

              <Text style={s.section}>Dietary preference</Text>
              <View style={s.dietList}>
                {DIET_OPTS.map(opt => {
                  const active = diet === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setDiet(opt.value)}
                      activeOpacity={0.85}
                      style={[s.dietCard, active && s.dietCardActive]}
                    >
                      <View style={[s.dietIcon, active && s.dietIconActive]}>
                        <Feather name={opt.icon} size={20} color={active ? '#fff' : BrandColors.primaryStart} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.dietT, active && s.dietTActive]}>{opt.label}</Text>
                        <Text style={s.dietSub}>{opt.sub}</Text>
                      </View>
                      {active && (
                        <View style={s.dietCheck}>
                          <Feather name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.section, { marginTop: Spacing.xl }]}>Allergens to avoid</Text>
              <Text style={s.sectionSub}>Optional — select any that apply.</Text>
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
                        size={13}
                        color={active ? '#fff' : BrandColors.textTertiary}
                      />
                      <Text style={[s.allergenT, active && s.allergenTActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={s.kicker}>One more thing</Text>
              <Text style={s.title}>Who are you usually cooking for?</Text>
              <Text style={s.subtitle}>
                We'll suggest the right serving sizes for your meals.
              </Text>

              <View style={s.cookForList}>
                {COOKING_FOR_OPTIONS.map(opt => {
                  const active = cookingFor === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setCookingFor(opt.value)}
                      activeOpacity={0.85}
                      style={[s.cookForCard, active && s.cookForCardActive]}
                    >
                      <View style={[s.cookForIcon, active && s.cookForIconActive]}>
                        <Feather name={opt.icon as any} size={22} color={active ? '#fff' : BrandColors.primaryStart} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.cookForT, active && s.cookForTActive]}>{opt.label}</Text>
                        <Text style={s.cookForSub}>{opt.sub}</Text>
                      </View>
                      {active && (
                        <View style={s.dietCheck}>
                          <Feather name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom action bar */}
        <View style={s.footer}>
          {step > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              disabled={busy}
              activeOpacity={0.8}
              style={s.backBtn}
            >
              <Feather name="arrow-left" size={18} color={BrandColors.textPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            disabled={busy || !canContinue}
            activeOpacity={0.85}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={
                (busy || !canContinue
                  ? ['#444', '#666']
                  : Gradients.primary) as [string, string]
              }
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.nextBtn}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.nextBtnT}>
                    {step < TOTAL_STEPS - 1 ? 'Continue' : 'Get cooking'}
                  </Text>
                  <Feather
                    name={step < TOTAL_STEPS - 1 ? 'arrow-right' : 'check-circle'}
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressDot: {
    width: 24, height: 4, borderRadius: 2,
    backgroundColor: BrandColors.dark600,
  },
  progressDotActive: { backgroundColor: BrandColors.primaryStart },
  skipT: { color: BrandColors.textTertiary, ...Typography.body, fontWeight: '600' },

  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  kicker: {
    color: BrandColors.primaryStart,
    fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  title: { color: BrandColors.textPrimary, ...Typography.h1, marginBottom: Spacing.xs },
  subtitle: { color: BrandColors.textSecondary, ...Typography.body, marginBottom: Spacing.xl, lineHeight: 22 },

  section: { color: BrandColors.textPrimary, ...Typography.bodyBold, marginBottom: Spacing.xs },
  sectionSub: { color: BrandColors.textTertiary, ...Typography.caption, marginBottom: Spacing.md },

  // Diet cards
  dietList: { gap: Spacing.sm },
  dietCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  dietCardActive: { borderColor: BrandColors.primaryStart, backgroundColor: 'rgba(255,107,53,0.08)' },
  dietIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  dietIconActive: { backgroundColor: BrandColors.primaryStart },
  dietT: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 16 },
  dietTActive: { color: BrandColors.primaryStart },
  dietSub: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 2 },
  dietCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: BrandColors.primaryStart,
    alignItems: 'center', justifyContent: 'center',
  },

  // Allergens
  allergenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: BrandColors.glass,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
  },
  allergenChipActive: { backgroundColor: BrandColors.primaryStart, borderColor: BrandColors.primaryStart },
  allergenT: { color: BrandColors.textSecondary, fontSize: 13, fontWeight: '600' },
  allergenTActive: { color: '#fff', fontWeight: '700' },

  // Cooking-for cards (reuses diet card style with bigger icon)
  cookForList: { gap: Spacing.sm, marginTop: Spacing.sm },
  cookForCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  cookForCardActive: { borderColor: BrandColors.primaryStart, backgroundColor: 'rgba(255,107,53,0.08)' },
  cookForIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  cookForIconActive: { backgroundColor: BrandColors.primaryStart },
  cookForT: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 16 },
  cookForTActive: { color: BrandColors.primaryStart },
  cookForSub: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 2 },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: BrandColors.glassBorder,
    backgroundColor: BrandColors.dark900,
  },
  backBtn: {
    width: 48, height: 48, borderRadius: Radius.full,
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    height: 48, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtnT: { color: '#fff', ...Typography.bodyBold, fontSize: 15 },
});
