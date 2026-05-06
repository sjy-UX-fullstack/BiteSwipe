/**
 * See All Recipes Screen
 */
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_RECIPES } from '@/constants/mock-data';

export default function SeeAllScreen() {
  const nav = useNavigation();

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.grid}>
          {MOCK_RECIPES.map(r => (
            <TouchableOpacity key={r.id} style={s.card} activeOpacity={0.8} onPress={() => (nav as any).navigate('modal', { id: r.id })}>
              <View style={s.imgWrap}>
                <Image source={typeof r.image === 'string' ? { uri: r.image } : r.image} style={s.img} resizeMode="cover" />
                <LinearGradient colors={['transparent','rgba(0,0,0,0.8)']} style={s.imgOverlay}>
                  <Text style={s.rName} numberOfLines={2}>{r.title}</Text>
                  <Text style={s.rMeta}>{r.cookTime} • {r.calories} cal</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:BrandColors.dark900},
  scroll:{padding:Spacing.lg},
  grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:Spacing.md},
  card:{width:'48%',aspectRatio:0.8,borderRadius:Radius.lg,overflow:'hidden',backgroundColor:BrandColors.dark600},
  imgWrap:{flex:1},
  img:{width:'100%',height:'100%',position:'absolute'},
  imgOverlay:{...StyleSheet.absoluteFillObject,justifyContent:'flex-end',padding:Spacing.sm},
  rName:{color:BrandColors.textPrimary,...Typography.bodyBold,marginBottom:2},
  rMeta:{color:BrandColors.textSecondary,fontSize:10},
});
