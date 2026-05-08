/**
 * Shopping List — checklist of ingredients to buy, persisted in Firestore.
 * Tap an item to check it off; "Clear checked" wipes completed items.
 */
import React, { useCallback, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import {
  getShoppingList, setItemChecked, removeItem, clearChecked, type ShoppingItem,
} from '@/services/shoppingList';

export default function ShoppingListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setItems(await getShoppingList());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const toggle = (name: string, currentlyChecked: boolean) => {
    // Optimistic
    setItems(prev => prev.map(it => it.name === name ? { ...it, checked: !currentlyChecked } : it));
    setItemChecked(name, !currentlyChecked).catch(() => refresh());
  };

  const handleRemove = (name: string) => {
    setItems(prev => prev.filter(it => it.name !== name));
    removeItem(name).catch(() => refresh());
  };

  const handleClear = async () => {
    const doIt = async () => {
      const removed = await clearChecked();
      if (removed > 0) refresh();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Remove all checked items from your shopping list?')) doIt();
    } else {
      Alert.alert('Clear checked', 'Remove all checked items?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: doIt },
      ]);
    }
  };

  const checkedCount = items.filter(i => i.checked).length;
  const total = items.length;

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.title}>Shopping List</Text>
          {total > 0 && (
            <View style={s.countPill}>
              <Text style={s.countT}>{checkedCount}/{total}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={BrandColors.primaryStart} /></View>
        ) : items.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Feather name="shopping-cart" size={36} color={BrandColors.textTertiary} />
            </View>
            <Text style={s.emptyTitle}>Your shopping list is empty</Text>
            <Text style={s.emptyDesc}>
              Open any recipe and tap "Add missing to shopping list" to fill this up.
            </Text>
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
              {items.map((it, i) => (
                <TouchableOpacity
                  key={`${it.name}-${i}`}
                  onPress={() => toggle(it.name, it.checked)}
                  activeOpacity={0.75}
                  style={[s.row, it.checked && s.rowDone]}
                >
                  <View style={[s.checkbox, it.checked && s.checkboxOn]}>
                    {it.checked && <Feather name="check" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.itemName, it.checked && s.itemNameDone]}>{it.name}</Text>
                    {it.fromRecipe && (
                      <Text style={s.itemSub} numberOfLines={1}>From: {it.fromRecipe}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(it.name)} hitSlop={10} style={s.removeBtn}>
                    <Feather name="x" size={14} color={BrandColors.textTertiary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <View style={{ height: 120 }} />
            </ScrollView>

            {checkedCount > 0 && (
              <View style={s.footer}>
                <TouchableOpacity onPress={handleClear} activeOpacity={0.85}>
                  <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.clearBtn}>
                    <Feather name="trash-2" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={s.clearBtnT}>Clear {checkedCount} checked</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </>
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
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: BrandColors.dark800, borderWidth: 1, borderColor: BrandColors.glassBorder, marginBottom: Spacing.sm },
  rowDone: { opacity: 0.5 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: BrandColors.textTertiary, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  checkboxOn: { backgroundColor: BrandColors.success, borderColor: BrandColors.success },
  itemName: { color: BrandColors.textPrimary, ...Typography.body },
  itemNameDone: { textDecorationLine: 'line-through', color: BrandColors.textTertiary },
  itemSub: { color: BrandColors.textTertiary, fontSize: 11, marginTop: 2 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: BrandColors.dark600, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: BrandColors.glassBorder },
  clearBtn: { flexDirection: 'row', paddingVertical: Spacing.md, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  clearBtnT: { color: '#fff', ...Typography.bodyBold },
});
