/**
 * Recipe Details Modal
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_RECIPES } from '@/constants/mock-data';
import { isRecipeSaved, saveRecipe, unsaveRecipe } from '@/services/savedRecipes';

export default function RecipeModal() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const recipe = MOCK_RECIPES.find(r => r.id === id) || MOCK_RECIPES[0];

  useEffect(() => {
    (async () => {
      setBookmarked(await isRecipeSaved(recipe.id));
    })();
  }, [recipe.id]);

  const toggleBookmark = async () => {
    if (bookmarkBusy) return;
    setBookmarkBusy(true);
    const next = !bookmarked;
    setBookmarked(next);  // optimistic
    try {
      if (next) {
        await saveRecipe({
          id: recipe.id,
          title: recipe.title,
          cuisine: recipe.cuisine,
          cookTime: recipe.cookTime,
          difficulty: recipe.difficulty,
          calories: recipe.calories,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          tags: recipe.tags,
          source: 'mock',
        });
      } else {
        await unsaveRecipe(recipe.id);
      }
      const msg = next ? `"${recipe.title}" saved to your collection!` : `"${recipe.title}" removed from saved.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert(next ? 'Saved!' : 'Removed', msg);
    } catch (e: any) {
      setBookmarked(!next);  // rollback
      const msg = e?.message ?? 'Could not update saved.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setBookmarkBusy(false);
    }
  };

  const handleStartCooking = () => {
    router.push({
      pathname: '/cook-mode',
      params: {
        title: recipe.title,
        steps: JSON.stringify(recipe.steps),
        recipeId: recipe.id,
        source: 'mock',
      },
    });
  };

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.imgWrap}>
          <Image
            source={typeof recipe.image === 'string' ? { uri: recipe.image } : recipe.image}
            style={s.img}
            resizeMode="cover"
          />
          <LinearGradient colors={['transparent', BrandColors.dark900]} style={s.imgOverlay} />
        </View>

        <View style={s.content}>
          <View style={s.headerRow}>
            <Text style={s.title}>{recipe.title}</Text>
            <TouchableOpacity style={s.saveBtn} onPress={toggleBookmark} activeOpacity={0.7}>
              <Feather
                name="bookmark"
                size={24}
                color={bookmarked ? BrandColors.primaryStart : BrandColors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <Text style={s.cuisine}>{recipe.cuisine} • {recipe.difficulty}</Text>

          <View style={s.stats}>
            <View style={s.stat}>
              <Feather name="clock" size={16} color={BrandColors.primaryStart} />
              <Text style={s.statT}>{recipe.cookTime}</Text>
            </View>
            <View style={s.stat}>
              <Feather name="zap" size={16} color={BrandColors.primaryStart} />
              <Text style={s.statT}>{recipe.calories} cal</Text>
            </View>
            <View style={s.stat}>
              <Feather name="users" size={16} color={BrandColors.primaryStart} />
              <Text style={s.statT}>{recipe.servings} servings</Text>
            </View>
          </View>

          <Text style={s.sectionTitle}>Ingredients</Text>
          <View style={s.ingList}>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={s.ingItem}>
                <Feather name="check-circle" size={16} color={BrandColors.success} />
                <Text style={s.ingText}>{ing}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Instructions</Text>
          <View style={s.stepList}>
            {recipe.steps.map((step, i) => (
              <View key={i} style={s.stepItem}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumT}>{i + 1}</Text>
                </View>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Cook Action */}
      <View style={s.bottomBar}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleStartCooking} style={{ flex: 1 }}>
          <LinearGradient
            colors={Gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.cookBtn}
          >
            <Feather name="play-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.cookBtnT}>Start Cooking</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  scroll: { paddingBottom: 100 },
  imgWrap: { width: '100%', aspectRatio: 1 },
  img: { ...StyleSheet.absoluteFillObject },
  imgOverlay: { ...StyleSheet.absoluteFillObject, top: '50%' },
  content: { padding: Spacing.lg, marginTop: -Spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md },
  title: { flex: 1, color: BrandColors.textPrimary, ...Typography.h1 },
  saveBtn: { padding: Spacing.xs },
  cuisine: { color: BrandColors.textSecondary, ...Typography.body, marginTop: Spacing.xxs },
  stats: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.xl, backgroundColor: BrandColors.dark800, padding: Spacing.md, borderRadius: Radius.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  statT: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  sectionTitle: { color: BrandColors.textPrimary, ...Typography.h2, marginBottom: Spacing.md, marginTop: Spacing.md },
  ingList: { gap: Spacing.sm, marginBottom: Spacing.xl },
  ingItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ingText: { color: BrandColors.textSecondary, ...Typography.body, flex: 1 },
  stepList: { gap: Spacing.lg },
  stepItem: { flexDirection: 'row', gap: Spacing.md },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: BrandColors.dark600, alignItems: 'center', justifyContent: 'center' },
  stepNumT: { color: BrandColors.primaryStart, fontWeight: '800' },
  stepText: { color: BrandColors.textSecondary, ...Typography.body, flex: 1, lineHeight: 22 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: BrandColors.dark900, borderTopWidth: 1, borderTopColor: BrandColors.glassBorder },
  cookBtn: { paddingVertical: Spacing.md, borderRadius: Radius.full, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  cookBtnT: { color: '#fff', ...Typography.bodyBold, fontSize: 16 },
});
