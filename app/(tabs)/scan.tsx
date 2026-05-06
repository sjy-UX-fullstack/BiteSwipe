/**
 * Scan Screen — AI Fridge Scanner.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import GlassCard from '@/components/ui/GlassCard';
import { BrandColors, Gradients, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import { MOCK_RECIPES } from '@/constants/mock-data';
import { scanFridge } from '@/services/ai';

interface ScannedIngredient {
  name: string;
  confidence: number;
  icon: string;
}

export default function ScanScreen() {
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [ingredients, setIngredients] = useState<ScannedIngredient[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleIngredient = (name: string) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsScanning(true);
        setScanned(true); // Show the loading UI in the second view
        
        try {
          const aiResult = await scanFridge(result.assets[0].base64);
          // Convert string array to our ScannedIngredient format
          const formatted = aiResult.map(name => ({
            name,
            confidence: 0.85 + Math.random() * 0.14, // Dummy confidence 85-99%
            icon: 'check' // Default icon
          }));
          setIngredients(formatted);
          setSelected(formatted.map(i => i.name)); // Auto-select all by default
        } catch (e) {
          console.error("AI Scan failed", e);
          alert("Failed to analyze image with AI.");
          setScanned(false);
        } finally {
          setIsScanning(false);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error picking image");
    }
  };

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{flex:1}}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Text style={s.sub}>AI-POWERED</Text>
          <View style={s.titleRow}>
            <Text style={s.title}>Fridge Scanner</Text>
            <Feather name="camera" size={28} color={BrandColors.primaryStart} />
          </View>
          <Text style={s.desc}>Snap a photo of your fridge or pantry and our AI will identify ingredients and suggest recipes!</Text>

          {!scanned ? (
            <View style={s.cameraBox}>
              <LinearGradient colors={['rgba(255,107,53,0.08)','rgba(255,45,135,0.08)']} style={s.cameraInner}>
                <View style={s.cornerTL}/><View style={s.cornerTR}/><View style={s.cornerBL}/><View style={s.cornerBR}/>
                <Feather name="aperture" size={64} color={BrandColors.primaryStart} style={{opacity:0.8}}/>
                <Text style={s.camText}>Tap to scan your fridge</Text>
                <Text style={s.camHint}>Point your camera at the open fridge</Text>
              </LinearGradient>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={{marginTop:Spacing.lg}}>
                <LinearGradient colors={Gradients.primary as [string,string]} start={{x:0,y:0}} end={{x:1,y:0}} style={[s.scanBtn, Shadows.glow]}>
                  <Feather name="maximize" size={20} color="#fff" style={{marginRight:8}}/>
                  <Text style={s.scanBtnText}>Scan Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : isScanning ? (
            <View style={{alignItems: 'center', justifyContent: 'center', marginTop: 100}}>
               <ActivityIndicator size="large" color={BrandColors.primaryStart} />
               <Text style={{color: BrandColors.textSecondary, marginTop: 16, ...Typography.body}}>Analyzing your ingredients with Gemini AI...</Text>
            </View>
          ) : (
            <>
              <GlassCard style={s.resultHeader} intensity="heavy">
                <View style={s.resultRow}>
                  <Feather name="check-circle" size={28} color={BrandColors.success} />
                  <View style={{flex:1}}>
                    <Text style={s.resultTitle}>{ingredients.length} items detected</Text>
                    <Text style={s.resultSub}>Tap to select ingredients for recipe matching</Text>
                  </View>
                </View>
              </GlassCard>

              <View style={s.grid}>
                {ingredients.map((item) => {
                  const isSelected = selected.includes(item.name);
                  return (
                    <TouchableOpacity key={item.name} onPress={() => toggleIngredient(item.name)} activeOpacity={0.7} style={s.ingCardWrapper}>
                      {isSelected ? (
                        <LinearGradient colors={Gradients.primary as [string,string]} style={s.ingCard}>
                          <Feather name={item.icon as any} size={24} color="#fff" />
                          <Text style={s.ingNameActive}>{item.name}</Text>
                          <Text style={s.ingConfActive}>{Math.round(item.confidence*100)}%</Text>
                        </LinearGradient>
                      ) : (
                        <GlassCard style={s.ingCardGlass}>
                          <Feather name={item.icon as any} size={24} color={BrandColors.textSecondary} />
                          <Text style={s.ingName}>{item.name}</Text>
                          <Text style={s.ingConf}>{Math.round(item.confidence*100)}%</Text>
                        </GlassCard>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selected.length > 0 && (
                <TouchableOpacity activeOpacity={0.85} style={{marginTop:Spacing.lg}}>
                  <LinearGradient colors={Gradients.primary as [string,string]} start={{x:0,y:0}} end={{x:1,y:0}} style={[s.scanBtn, Shadows.glow]}>
                    <Feather name="search" size={20} color="#fff" style={{marginRight:8}}/>
                    <Text style={s.scanBtnText}>Find {selected.length > 1 ? 'Recipes' : 'a Recipe'} ({selected.length} items)</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={s.section}>
                <View style={s.secTitleRow}>
                  <Feather name="award" size={20} color={BrandColors.accent} />
                  <Text style={s.secTitle}>Best Matches</Text>
                </View>
                {MOCK_RECIPES.slice(0,3).map(r => (
                  <GlassCard key={r.id} style={s.matchCard}>
                    <View style={s.matchRow}>
                      <View style={s.matchIconBg}>
                        <Feather name={r.icon as any} size={24} color={BrandColors.textPrimary} />
                      </View>
                      <View style={{flex:1}}>
                        <Text style={s.matchName}>{r.title}</Text>
                        <Text style={s.matchMeta}>
                          <Feather name="clock" size={10}/> {r.cookTime} · <Feather name="zap" size={10}/> {r.calories} cal
                        </Text>
                      </View>
                      <LinearGradient colors={Gradients.primary as [string,string]} style={s.matchBadge}>
                        <Text style={s.matchPct}>{r.matchPercentage}%</Text>
                      </LinearGradient>
                    </View>
                  </GlassCard>
                ))}
              </View>

              <TouchableOpacity onPress={() => {setScanned(false);setIngredients([]);setSelected([]);}} style={{marginBottom:Spacing.xl}}>
                <View style={s.rescanBtn}>
                  <Feather name="refresh-ccw" size={16} color={BrandColors.textSecondary} style={{marginRight:8}}/>
                  <Text style={s.rescanText}>Scan Again</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
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
  cameraBox:{alignItems:'center',marginTop:Spacing.md},
  cameraInner:{width:'100%',aspectRatio:0.8,borderRadius:Radius.xxl,borderWidth:2,borderColor:BrandColors.glassBorder,borderStyle:'dashed',alignItems:'center',justifyContent:'center',gap:Spacing.md},
  camText:{color:BrandColors.textPrimary,...Typography.bodyBold},
  camHint:{color:BrandColors.textTertiary,...Typography.caption},
  cornerTL:{position:'absolute',top:16,left:16,width:32,height:32,borderTopWidth:3,borderLeftWidth:3,borderColor:BrandColors.primaryStart,borderTopLeftRadius:Radius.sm},
  cornerTR:{position:'absolute',top:16,right:16,width:32,height:32,borderTopWidth:3,borderRightWidth:3,borderColor:BrandColors.primaryStart,borderTopRightRadius:Radius.sm},
  cornerBL:{position:'absolute',bottom:16,left:16,width:32,height:32,borderBottomWidth:3,borderLeftWidth:3,borderColor:BrandColors.primaryEnd,borderBottomLeftRadius:Radius.sm},
  cornerBR:{position:'absolute',bottom:16,right:16,width:32,height:32,borderBottomWidth:3,borderRightWidth:3,borderColor:BrandColors.primaryEnd,borderBottomRightRadius:Radius.sm},
  scanBtn:{flexDirection:'row',paddingHorizontal:Spacing.xl,paddingVertical:Spacing.md,borderRadius:Radius.full,alignItems:'center',justifyContent:'center'},
  scanBtnText:{color:BrandColors.textPrimary,...Typography.bodyBold},
  resultHeader:{marginBottom:Spacing.lg},
  resultRow:{flexDirection:'row',alignItems:'center',gap:Spacing.md},
  resultTitle:{color:BrandColors.textPrimary,...Typography.bodyBold},
  resultSub:{color:BrandColors.textTertiary,...Typography.caption},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.sm},
  ingCardWrapper:{width:'31%'},
  ingCard:{alignItems:'center',gap:Spacing.xxs,padding:Spacing.md,borderRadius:Radius.lg,minHeight:90,justifyContent:'center'},
  ingCardGlass:{alignItems:'center',gap:Spacing.xxs,minHeight:90,justifyContent:'center',padding:Spacing.md},
  ingName:{color:BrandColors.textSecondary,...Typography.caption,fontWeight:'600',textAlign:'center'},
  ingNameActive:{color:'#fff',...Typography.caption,fontWeight:'700',textAlign:'center'},
  ingConf:{color:BrandColors.textTertiary,fontSize:10},
  ingConfActive:{color:'rgba(255,255,255,0.7)',fontSize:10},
  section:{marginTop:Spacing.xl},
  secTitleRow:{flexDirection:'row',alignItems:'center',gap:Spacing.xs,marginBottom:Spacing.md},
  secTitle:{color:BrandColors.textPrimary,...Typography.h3},
  matchCard:{marginBottom:Spacing.sm},
  matchRow:{flexDirection:'row',alignItems:'center',gap:Spacing.md},
  matchIconBg:{width:44,height:44,borderRadius:22,backgroundColor:BrandColors.dark600,alignItems:'center',justifyContent:'center'},
  matchName:{color:BrandColors.textPrimary,...Typography.bodyBold},
  matchMeta:{color:BrandColors.textTertiary,...Typography.caption,marginTop:2},
  matchBadge:{paddingHorizontal:Spacing.sm,paddingVertical:Spacing.xxs,borderRadius:Radius.full},
  matchPct:{color:BrandColors.textPrimary,fontSize:13,fontWeight:'800'},
  rescanBtn:{flexDirection:'row',backgroundColor:BrandColors.glass,borderWidth:1,borderColor:BrandColors.glassBorder,paddingVertical:Spacing.sm,borderRadius:Radius.full,alignItems:'center',justifyContent:'center',marginTop:Spacing.md},
  rescanText:{color:BrandColors.textSecondary,...Typography.bodyBold},
});
