/**
 * Trending Screen — Viral recipes from Instagram & YouTube.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import GlassCard from '@/components/ui/GlassCard';
import { BrandColors, Gradients, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import { MOCK_TRENDING } from '@/constants/mock-data';
import { parseRecipeText } from '@/services/ai';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Using the same max width as layout for web compatibility
const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, 428);
const COL_W = (CONTAINER_WIDTH - (Spacing.lg * 2) - Spacing.sm) / 2;

export default function TrendingScreen() {
  const [filter, setFilter] = useState<'all'|'instagram'|'youtube'>('all');
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const filtered = filter === 'all' ? MOCK_TRENDING : MOCK_TRENDING.filter(t => t.source === filter);
  const hero = filtered[0];
  const grid = filtered.slice(1);

  const handleImport = async () => {
    if (!url.trim()) return;
    setIsImporting(true);
    try {
      const recipeData = await parseRecipeText(url);
      if (recipeData) {
        Alert.alert("Recipe Extracted!", `Title: ${recipeData.title}\nIngredients: ${recipeData.ingredients?.length} items.`);
      } else {
        Alert.alert("Failed", "Could not extract recipe details from this link.");
      }
    } catch (e) {
      Alert.alert("Error", "An error occurred while importing the recipe.");
    } finally {
      setIsImporting(false);
      setUrl('');
    }
  };

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{flex:1}}>
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
              <Feather name="link" size={24} color={BrandColors.textSecondary} style={s.impIcon}/>
              <View style={{flex:1}}>
                <Text style={s.impTitle}>Import a Recipe</Text>
                <Text style={s.impDesc}>Paste an Instagram or YouTube link and our AI extracts the recipe instantly.</Text>
              </View>
            </View>
            <View style={s.inputRow}>
              <View style={s.inputWrapper}>
                <TextInput 
                  placeholder="https://instagram.com/p/..." 
                  placeholderTextColor={BrandColors.textTertiary}
                  style={s.input}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={handleImport} disabled={isImporting}>
                <LinearGradient colors={['#56CCF2', '#2F80ED']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.impBtn}>
                  {isImporting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="download" size={16} color="#fff" style={{marginRight:8}}/>
                      <Text style={s.impBtnText}>Import</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            {['all','instagram','youtube'].map((f) => (
              <TouchableOpacity key={f} onPress={()=>setFilter(f as any)} activeOpacity={0.7}>
                <View style={[s.filterChip, filter===f && s.filterActive]}>
                  {f==='all' && <Feather name="globe" size={14} color={filter===f ? '#fff':BrandColors.textSecondary} />}
                  {f==='instagram' && <Feather name="instagram" size={14} color={filter===f ? '#fff':BrandColors.textSecondary} />}
                  {f==='youtube' && <Feather name="youtube" size={14} color={filter===f ? '#fff':BrandColors.textSecondary} />}
                  <Text style={[s.filterText, filter===f && s.filterTextA]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Hero */}
          {hero && (
            <TouchableOpacity activeOpacity={0.9} style={s.heroWrapper}>
              <View style={[s.heroCard, Shadows.card]}>
                <Image source={typeof hero.image === 'string' ? { uri: hero.image } : hero.image} style={s.heroImg} resizeMode="cover" />
                <LinearGradient colors={['transparent','rgba(0,0,0,0.8)','rgba(0,0,0,0.95)']} style={s.heroOverlay}>
                  <View style={s.sourceBadge}>
                     {hero.source === 'instagram' ? <Feather name="instagram" size={12} color="#fff" /> : <Feather name="youtube" size={12} color="#fff" />}
                     <Text style={s.sourceT}>{hero.source === 'instagram' ? 'Instagram' : 'YouTube'}</Text>
                  </View>
                  <View style={s.heroIcon}>
                     <Feather name={hero.icon as any || 'cloud'} size={24} color="#fff" />
                  </View>
                  <Text style={s.heroTitleText} numberOfLines={2}>{hero.title}</Text>
                  <Text style={s.heroMeta}>{hero.creator} · {hero.views} views</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}

          {/* Grid */}
          <View style={s.grid}>
            {grid.map(t => (
              <TouchableOpacity key={t.id} activeOpacity={0.9}>
                <View style={[s.gridCard, Shadows.card]}>
                  <Image source={typeof t.image === 'string' ? { uri: t.image } : t.image} style={s.gridImg} resizeMode="cover" />
                  <LinearGradient colors={['transparent','rgba(0,0,0,0.8)']} style={s.gridOverlay}>
                    <View style={s.sourceBadgeGrid}>
                       {t.source === 'instagram' ? <Feather name="instagram" size={10} color="#fff" /> : <Feather name="youtube" size={10} color="#fff" />}
                    </View>
                    <View style={{flex:1}} />
                    <Text style={s.gridTitle} numberOfLines={2}>{t.title}</Text>
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
  screen:{flex:1,backgroundColor:BrandColors.dark900},
  scroll:{paddingHorizontal:Spacing.lg,paddingTop:Spacing.md,paddingBottom:Spacing.xxl},
  sub:{color:BrandColors.textTertiary,...Typography.tiny,marginBottom:Spacing.xxs},
  titleRow:{flexDirection:'row',alignItems:'center',gap:Spacing.xs,marginBottom:Spacing.xs},
  title:{color:BrandColors.textPrimary,...Typography.h1},
  desc:{color:BrandColors.textSecondary,...Typography.body,marginBottom:Spacing.lg},
  importer:{padding:Spacing.md,marginBottom:Spacing.lg},
  impRow:{flexDirection:'row',marginBottom:Spacing.sm},
  impIcon:{transform:[{rotate:'45deg'}],marginRight:Spacing.sm},
  impTitle:{color:BrandColors.textPrimary,...Typography.bodyBold},
  impDesc:{color:BrandColors.textTertiary,...Typography.caption,marginTop:2},
  inputRow:{flexDirection:'row',alignItems:'center',gap:Spacing.sm},
  inputWrapper:{flex:1,backgroundColor:'rgba(255,255,255,0.05)',borderRadius:Radius.full,borderWidth:1,borderColor:BrandColors.glassBorder,paddingHorizontal:Spacing.md},
  input:{color:BrandColors.textPrimary,height:40,...Typography.body},
  impBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:10,paddingHorizontal:Spacing.md,borderRadius:Radius.full},
  impBtnText:{color:'#fff',...Typography.bodyBold},
  filters:{gap:Spacing.sm,marginBottom:Spacing.lg},
  filterChip:{flexDirection:'row',alignItems:'center',gap:Spacing.xxs,paddingHorizontal:Spacing.md,paddingVertical:Spacing.xs,borderRadius:Radius.full,backgroundColor:BrandColors.glass,borderWidth:1,borderColor:BrandColors.glassBorder},
  filterActive:{backgroundColor:BrandColors.dark600,borderColor:BrandColors.textPrimary},
  filterText:{color:BrandColors.textSecondary,...Typography.caption},
  filterTextA:{color:BrandColors.textPrimary,fontWeight:'700'},
  heroWrapper:{marginBottom:Spacing.sm},
  heroCard:{width:'100%',aspectRatio:16/9,borderRadius:Radius.xl,overflow:'hidden',backgroundColor:BrandColors.dark600},
  heroImg:{width:'100%',height:'100%',position:'absolute'},
  heroOverlay:{...StyleSheet.absoluteFillObject,padding:Spacing.md,justifyContent:'flex-end'},
  sourceBadge:{position:'absolute',top:Spacing.md,right:Spacing.md,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(0,0,0,0.5)',paddingHorizontal:Spacing.sm,paddingVertical:4,borderRadius:Radius.full},
  sourceT:{color:'#fff',fontSize:10,fontWeight:'600'},
  heroIcon:{marginBottom:Spacing.xs},
  heroTitleText:{color:BrandColors.textPrimary,...Typography.h2,marginBottom:2},
  heroMeta:{color:BrandColors.textSecondary,...Typography.caption},
  grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:Spacing.sm},
  gridCard:{width:COL_W,aspectRatio:1,borderRadius:Radius.lg,overflow:'hidden',backgroundColor:BrandColors.dark600},
  gridImg:{width:'100%',height:'100%',position:'absolute'},
  gridOverlay:{...StyleSheet.absoluteFillObject,padding:Spacing.sm},
  sourceBadgeGrid:{alignSelf:'flex-end',backgroundColor:'rgba(0,0,0,0.5)',padding:6,borderRadius:Radius.full},
  gridTitle:{color:BrandColors.textPrimary,...Typography.caption,fontWeight:'700'},
});
