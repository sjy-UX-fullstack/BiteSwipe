/**
 * Weekly Meal Planner — pick a recipe for breakfast/lunch/dinner across the next 7 days.
 * Source: bookmarked recipes only (users/{uid}/saved). Persists to users/{uid}/mealPlan/current.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import {
  clearMeal, dateKey, getWeekPlan, MEAL_SLOTS, setMeal, upcomingDays,
  type MealSlot, type PlannedRecipe, type WeekEntries,
} from '@/services/mealPlanner';
import { listSavedRecipes, type SavedRecipe } from '@/services/savedRecipes';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};
const SLOT_ICON: Record<MealSlot, string> = {
  breakfast: 'sunrise',
  lunch: 'sun',
  dinner: 'moon',
};

export default function MealPlannerScreen() {
  const router = useRouter();
  const days = useMemo(() => upcomingDays(7), []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [entries, setEntries] = useState<WeekEntries>({});
  const [loading, setLoading] = useState(true);
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null);
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [customText, setCustomText] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    const e = await getWeekPlan();
    setEntries(e);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const openPicker = async (slot: MealSlot) => {
    setPickerSlot(slot);
    setSavedLoading(true);
    const items = await listSavedRecipes();
    setSaved(items);
    setSavedLoading(false);
  };

  const closePicker = () => {
    setPickerSlot(null);
    setCustomText('');
  };

  const persistMeal = async (planned: PlannedRecipe) => {
    if (!pickerSlot) return;
    const dateK = dateKey(days[selectedIdx]);
    // Optimistic update
    setEntries(prev => ({
      ...prev,
      [dateK]: { ...(prev[dateK] ?? {}), [pickerSlot]: planned },
    }));
    closePicker();
    try {
      await setMeal(days[selectedIdx], pickerSlot, planned);
    } catch (e: any) {
      const msg = e?.message ?? 'Could not save meal';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      refresh();
    }
  };

  const assign = (recipe: SavedRecipe) =>
    persistMeal({
      recipeId: recipe.id,
      title: recipe.title,
      source: 'saved',
      cookTime: recipe.cookTime,
      image: recipe.image,
    });

  const addCustom = () => {
    const title = customText.trim();
    if (!title) return;
    persistMeal({
      recipeId: `custom_${Date.now()}`,
      title,
      source: 'custom',
    });
  };

  const remove = (slot: MealSlot) => {
    const doRemove = async () => {
      const dateK = dateKey(days[selectedIdx]);
      setEntries(prev => {
        const next = { ...prev };
        if (next[dateK]) {
          const day = { ...next[dateK] };
          delete day[slot];
          if (Object.keys(day).length === 0) delete next[dateK];
          else next[dateK] = day;
        }
        return next;
      });
      try {
        await clearMeal(days[selectedIdx], slot);
      } catch (e: any) {
        refresh();
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${SLOT_LABEL[slot]} for this day?`)) doRemove();
    } else {
      Alert.alert('Remove', `Remove ${SLOT_LABEL[slot]} for this day?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const openRecipe = (planned: PlannedRecipe) => {
    if (planned.source === 'custom') return; // No underlying recipe
    if (planned.source === 'mock') {
      router.push({ pathname: '/modal', params: { id: planned.recipeId } });
    } else {
      // For saved/ai, full recipe lives in /saved.
      router.push('/saved' as any);
    }
  };

  const selectedDay = days[selectedIdx];
  const selectedKey = dateKey(selectedDay);
  const dayPlan = entries[selectedKey] ?? {};
  const filledCount = Object.keys(dayPlan).length;

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Meal Planner</Text>
            <Text style={s.subtitle}>Plan your week, one meal at a time</Text>
          </View>
        </View>

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.daysRow}
        >
          {days.map((d, i) => {
            const isSelected = i === selectedIdx;
            const dayKey = dateKey(d);
            const count = Object.keys(entries[dayKey] ?? {}).length;
            return (
              <TouchableOpacity
                key={dayKey}
                onPress={() => setSelectedIdx(i)}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={Gradients.primary as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.dayChip}
                  >
                    <Text style={[s.dayName, { color: '#fff' }]}>{SHORT_DAYS[d.getDay()]}</Text>
                    <Text style={[s.dayNum, { color: '#fff' }]}>{d.getDate()}</Text>
                    {count > 0 && <View style={[s.dayDot, { backgroundColor: '#fff' }]} />}
                  </LinearGradient>
                ) : (
                  <View style={[s.dayChip, s.dayChipInactive]}>
                    <Text style={s.dayName}>{SHORT_DAYS[d.getDay()]}</Text>
                    <Text style={s.dayNum}>{d.getDate()}</Text>
                    {count > 0 && <View style={s.dayDot} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={BrandColors.primaryStart} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.mealList}
          >
            <View style={s.dayHeader}>
              <Text style={s.dayHeaderT}>
                {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={s.dayHeaderSub}>
                {filledCount === 0 ? 'No meals planned' : `${filledCount} of 3 meals planned`}
              </Text>
            </View>

            {MEAL_SLOTS.map(slot => {
              const planned = dayPlan[slot];
              return (
                <View key={slot} style={s.slotCard}>
                  <View style={s.slotHeader}>
                    <Feather name={SLOT_ICON[slot] as any} size={18} color={BrandColors.primaryStart} />
                    <Text style={s.slotLabel}>{SLOT_LABEL[slot]}</Text>
                  </View>
                  {planned ? (
                    <View style={s.plannedRow}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={planned.source === 'custom' ? 1 : 0.75}
                        onPress={() => openRecipe(planned)}
                        disabled={planned.source === 'custom'}
                      >
                        <Text style={s.plannedTitle} numberOfLines={2}>{planned.title}</Text>
                        <View style={s.plannedMeta}>
                          {planned.source === 'custom' ? (
                            <>
                              <Feather name="edit-3" size={11} color={BrandColors.textTertiary} />
                              <Text style={s.plannedMetaT}>Custom entry</Text>
                            </>
                          ) : planned.cookTime ? (
                            <>
                              <Feather name="clock" size={11} color={BrandColors.textTertiary} />
                              <Text style={s.plannedMetaT}>{planned.cookTime}</Text>
                            </>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => remove(slot)} hitSlop={8} style={s.removeBtn}>
                        <Feather name="x" size={16} color={BrandColors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => openPicker(slot)}
                      activeOpacity={0.75}
                      style={s.emptySlot}
                    >
                      <Feather name="plus-circle" size={18} color={BrandColors.primaryStart} />
                      <Text style={s.emptySlotT}>Add a recipe</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Recipe picker modal */}
      <Modal
        visible={pickerSlot !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePicker}
      >
        <View style={s.screen}>
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                Pick a recipe for {pickerSlot ? SLOT_LABEL[pickerSlot] : ''}
              </Text>
              <TouchableOpacity onPress={closePicker} style={s.backBtn}>
                <Feather name="x" size={20} color={BrandColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: Spacing.lg }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Custom entry */}
              <Text style={s.pickerSection}>Add a custom meal</Text>
              <View style={s.customRow}>
                <TextInput
                  style={s.customInput}
                  placeholder="e.g. Leftover pasta, Order pizza…"
                  placeholderTextColor={BrandColors.textTertiary}
                  value={customText}
                  onChangeText={setCustomText}
                  onSubmitEditing={addCustom}
                  returnKeyType="done"
                  maxLength={80}
                />
                <TouchableOpacity
                  onPress={addCustom}
                  disabled={customText.trim().length === 0}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      (customText.trim().length === 0
                        ? ['#444', '#666']
                        : Gradients.primary) as [string, string]
                    }
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.customAddBtn}
                  >
                    <Feather name="plus" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Saved recipes */}
              <Text style={[s.pickerSection, { marginTop: Spacing.xl }]}>From your saved recipes</Text>
              {savedLoading ? (
                <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator color={BrandColors.primaryStart} />
                </View>
              ) : saved.length === 0 ? (
                <View style={s.savedEmpty}>
                  <Text style={s.savedEmptyT}>
                    No saved recipes yet. Bookmark recipes from Search, Scan, or Swipe — they'll appear here.
                  </Text>
                  <TouchableOpacity
                    onPress={() => { closePicker(); router.replace('/(tabs)/search' as any); }}
                    activeOpacity={0.85}
                    style={{ marginTop: Spacing.md }}
                  >
                    <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
                      <Feather name="search" size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={s.ctaT}>Find a recipe</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                saved.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    activeOpacity={0.8}
                    onPress={() => assign(r)}
                    style={s.pickItem}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.pickTitle} numberOfLines={2}>{r.title}</Text>
                      <Text style={s.pickMeta}>
                        {[r.cuisine, r.cookTime, r.calories ? `${r.calories} cal` : null]
                          .filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
                  </TouchableOpacity>
                ))
              )}
              <View style={{ height: Spacing.xxl }} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: BrandColors.textPrimary, ...Typography.h2 },
  subtitle: { color: BrandColors.textSecondary, ...Typography.caption, marginTop: 2 },
  daysRow: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  dayChip: {
    width: 56, paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  dayChipInactive: {
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
  },
  dayName: {
    fontSize: 11, fontWeight: '700', color: BrandColors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dayNum: {
    fontSize: 18, fontWeight: '800', color: BrandColors.textPrimary,
  },
  dayDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: BrandColors.primaryStart, marginTop: 2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mealList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  dayHeader: { marginBottom: Spacing.lg },
  dayHeaderT: { color: BrandColors.textPrimary, ...Typography.h3 },
  dayHeaderSub: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 2 },
  slotCard: {
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  slotHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  slotLabel: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 14 },
  emptySlot: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,107,53,0.06)',
    borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,107,53,0.3)',
  },
  emptySlotT: { color: BrandColors.primaryStart, ...Typography.bodyBold, fontSize: 13 },
  plannedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  plannedTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 15 },
  plannedMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  plannedMetaT: { color: BrandColors.textTertiary, fontSize: 11, fontWeight: '600' },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: BrandColors.dark600,
    alignItems: 'center', justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: BrandColors.glassBorder,
  },
  modalTitle: { color: BrandColors.textPrimary, ...Typography.h3, flex: 1 },
  pickerSection: {
    color: BrandColors.textSecondary,
    fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  customRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  customInput: {
    flex: 1,
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.md,
    color: BrandColors.textPrimary,
    fontSize: 15,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  customAddBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  savedEmpty: {
    alignItems: 'center',
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  savedEmptyT: {
    color: BrandColors.textSecondary, ...Typography.body, textAlign: 'center',
  },
  pickItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: BrandColors.dark800,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pickTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 15 },
  pickMeta: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 2 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xxl, gap: Spacing.sm,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: BrandColors.dark800,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { color: BrandColors.textPrimary, ...Typography.h3, textAlign: 'center' },
  emptyDesc: { color: BrandColors.textSecondary, ...Typography.body, textAlign: 'center' },
  cta: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  ctaT: { color: '#fff', ...Typography.bodyBold },
});
