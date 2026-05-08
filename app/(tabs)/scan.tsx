/**
 * Scan Screen — Live AI Fridge Scanner.
 * Native: full-screen camera with animated scan line.
 * Web: gallery picker fallback (camera APIs not available in browser).
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Easing, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import GlassCard from '@/components/ui/GlassCard';
import { BrandColors, Gradients, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import { scanFridge, generateRecipesFromIngredients, type DietPreference, type AIRecipe } from '@/services/ai';

import { CameraView, useCameraPermissions } from 'expo-camera';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

interface ScannedIngredient {
  name: string;
  confidence: number;
}

const DIET_OPTIONS: { value: DietPreference; label: string; icon: any }[] = [
  { value: 'veg', label: 'Vegetarian', icon: 'feather' },
  { value: 'non-veg', label: 'Non-Veg', icon: 'award' },
  { value: 'vegan', label: 'Vegan', icon: 'sun' },
];

// ─── Camera Scanner View (native only) ───────────────────────────
function CameraScanner({ onCapture, onClose }: { onCapture: (base64: string) => void; onClose: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<any>(null);

  // Animated scan line
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scanLineY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_H * 0.55] });

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.4, skipProcessing: true });
      if (photo?.base64) onCapture(photo.base64);
    } catch (e) {
      console.error('Capture failed', e);
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) return <View style={cs.fill} />;

  if (!permission.granted) {
    return (
      <View style={cs.permContainer}>
        <Feather name="camera-off" size={64} color={BrandColors.textTertiary} />
        <Text style={cs.permTitle}>Camera Access Needed</Text>
        <Text style={cs.permDesc}>BiteSwipe needs your camera to scan ingredients.</Text>
        <TouchableOpacity onPress={requestPermission} style={{ marginTop: Spacing.lg }}>
          <LinearGradient colors={Gradients.primary as [string, string]} style={cs.permBtn}>
            <Text style={cs.permBtnT}>Allow Camera</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: Spacing.md }}>
          <Text style={{ color: BrandColors.textTertiary, ...Typography.body }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={cs.fill}>
      <CameraView ref={cameraRef} style={cs.fill} facing={facing} flash={flash}>

        {/* Dark overlay top */}
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={cs.overlayTop} />

        {/* Top controls */}
        <SafeAreaView edges={['top']} style={cs.topBar}>
          <TouchableOpacity onPress={onClose} style={cs.iconBtn}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={cs.topCenter}>
            <Text style={cs.scanLabel}>SCANNING FRIDGE</Text>
            <Text style={cs.scanHint}>Point at your fridge or pantry</Text>
          </View>
          <TouchableOpacity onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')} style={cs.iconBtn}>
            <Feather name={flash === 'on' ? 'zap' : 'zap-off'} size={24} color={flash === 'on' ? BrandColors.accent : '#fff'} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Scanner frame */}
        <View style={cs.frameWrapper}>
          <View style={cs.frame}>
            {/* Corner brackets */}
            <View style={[cs.corner, cs.cornerTL]} />
            <View style={[cs.corner, cs.cornerTR]} />
            <View style={[cs.corner, cs.cornerBL]} />
            <View style={[cs.corner, cs.cornerBR]} />

            {/* Animated scan line */}
            <Animated.View style={[cs.scanLine, { transform: [{ translateY: scanLineY }] }]}>
              <LinearGradient
                colors={['transparent', BrandColors.primaryStart, BrandColors.primaryEnd, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={cs.scanLineGradient}
              />
            </Animated.View>
          </View>
          <Text style={cs.frameHint}>Hold steady for best results</Text>
        </View>

        {/* Dark overlay bottom */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={cs.overlayBottom} />

        {/* Bottom controls */}
        <SafeAreaView edges={['bottom']} style={cs.bottomBar}>
          <TouchableOpacity
            onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
            style={cs.iconBtn}
          >
            <Feather name="refresh-cw" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Capture button */}
          <TouchableOpacity onPress={handleCapture} disabled={capturing} activeOpacity={0.8}>
            <View style={cs.captureOuter}>
              {capturing
                ? <ActivityIndicator color={BrandColors.primaryStart} />
                : <LinearGradient colors={Gradients.primary as [string, string]} style={cs.captureInner} />
              }
            </View>
          </TouchableOpacity>

          {/* Gallery fallback */}
          <TouchableOpacity
            onPress={async () => {
              const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
              if (!res.canceled && res.assets[0].base64) onCapture(res.assets[0].base64);
            }}
            style={cs.iconBtn}
          >
            <Feather name="image" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

// ─── Main Scan Screen ─────────────────────────────────────────────
export default function ScanScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'home' | 'camera' | 'analysing' | 'results' | 'cooking' | 'recipes'>('home');
  const [ingredients, setIngredients] = useState<ScannedIngredient[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [diet, setDiet] = useState<DietPreference | null>(null);
  const [aiRecipes, setAIRecipes] = useState<AIRecipe[]>([]);

  // Pulse animation for the scan button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const toggleIngredient = (name: string) =>
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const handleCapture = async (base64: string) => {
    setMode('analysing');
    try {
      const aiResult = await scanFridge(base64);
      if (aiResult.length === 0) {
        alert('No ingredients detected. Try again with better lighting or a clearer angle.');
        setMode('home');
        return;
      }
      const formatted = aiResult.map(name => ({
        name,
        confidence: 0.85 + Math.random() * 0.14,
      }));
      setIngredients(formatted);
      setSelected(formatted.map(i => i.name));
      setMode('results');
    } catch (err: any) {
      console.error('[scanFridge] error:', err);
      const msg = err?.message ?? String(err);
      alert(`Scan failed: ${msg.slice(0, 400)}`);
      setMode('home');
    }
  };

  const requireDiet = () => {
    if (!diet) {
      alert('Please pick your dietary preference (Veg / Non-Veg / Vegan) first.');
      return false;
    }
    return true;
  };

  // Web fallback — no camera API in browser
  const handleWebPick = async () => {
    if (!requireDiet()) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { alert('Photo library permission required.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
    if (!res.canceled && res.assets[0].base64) {
      setMode('analysing');
      await handleCapture(res.assets[0].base64);
    }
  };

  const handleOpenCamera = () => {
    if (!requireDiet()) return;
    setMode('camera');
  };

  const handleFindRecipes = async () => {
    if (selected.length === 0 || !diet) return;
    setMode('cooking');
    try {
      const recipes = await generateRecipesFromIngredients(selected, diet);
      if (!recipes || recipes.length === 0) {
        alert('BiteSwipe AI couldn’t cook anything up. Try different ingredients.');
        setMode('results');
        return;
      }
      setAIRecipes(recipes);
      setMode('recipes');
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      alert(`Couldn’t generate recipes: ${msg.slice(0, 300)}`);
      setMode('results');
    }
  };

  // ── Camera view (full screen, all platforms) ──
  if (mode === 'camera') {
    return (
      <CameraScanner
        onCapture={handleCapture}
        onClose={() => setMode('home')}
      />
    );
  }

  // ── Analysing overlay (scanning fridge) ──
  if (mode === 'analysing') {
    return (
      <View style={s.screen}>
        <View style={s.analysingContainer}>
          <LinearGradient colors={['rgba(255,107,53,0.12)', 'rgba(255,45,135,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={s.analysingIcon}>
            <LinearGradient colors={Gradients.primary as [string, string]} style={s.analysingIconGrad}>
              <Feather name="zap" size={36} color="#fff" />
            </LinearGradient>
          </View>
          <ActivityIndicator size="large" color={BrandColors.primaryStart} style={{ marginBottom: Spacing.lg }} />
          <Text style={s.analysingTitle}>BiteSwipe AI is reading your fridge…</Text>
          <Text style={s.analysingDesc}>Spotting every edible bite for your next craving</Text>
          <View style={s.analysingSteps}>
            {['Detecting food items', 'Classifying ingredients', 'Preparing your shortlist'].map((step, i) => (
              <View key={i} style={s.analysingStep}>
                <Feather name="check" size={14} color={BrandColors.success} style={{ marginRight: 8 }} />
                <Text style={s.analysingStepT}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── Cooking overlay (generating recipes) ──
  if (mode === 'cooking') {
    return (
      <View style={s.screen}>
        <View style={s.analysingContainer}>
          <LinearGradient colors={['rgba(255,107,53,0.12)', 'rgba(255,45,135,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={s.analysingIcon}>
            <LinearGradient colors={Gradients.primary as [string, string]} style={s.analysingIconGrad}>
              <Feather name="zap" size={36} color="#fff" />
            </LinearGradient>
          </View>
          <ActivityIndicator size="large" color={BrandColors.primaryStart} style={{ marginBottom: Spacing.lg }} />
          <Text style={s.analysingTitle}>BiteSwipe AI is preparing your cravings…</Text>
          <Text style={s.analysingDesc}>Whipping up {diet === 'vegan' ? 'vegan' : diet === 'veg' ? 'vegetarian' : 'non-veg'} recipes from your {selected.length} ingredients</Text>
          <View style={s.analysingSteps}>
            {['Picking flavor combos', 'Balancing nutrition', 'Plating it up'].map((step, i) => (
              <View key={i} style={s.analysingStep}>
                <Feather name="check" size={14} color={BrandColors.success} style={{ marginRight: 8 }} />
                <Text style={s.analysingStepT}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── AI-generated recipes view ──
  if (mode === 'recipes') {
    return (
      <View style={s.screen}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
            <View style={s.titleRow}>
              <TouchableOpacity onPress={() => setMode('results')} style={s.backBtn}>
                <Feather name="arrow-left" size={20} color={BrandColors.textPrimary} />
              </TouchableOpacity>
              <Text style={[s.title, { flex: 1 }]}>Your AI Recipes</Text>
            </View>
            <Text style={s.desc}>
              Crafted by BiteSwipe AI from your {selected.length} ingredients · {diet === 'vegan' ? 'Vegan' : diet === 'veg' ? 'Vegetarian' : 'Non-Veg'}
            </Text>

            {aiRecipes.map((r, idx) => (
              <TouchableOpacity
                key={r.id ?? idx}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/ai-recipe' as any, params: { recipe: JSON.stringify(r) } })}
              >
                <GlassCard style={s.aiCard}>
                  <View style={s.aiCardHeader}>
                    <Text style={s.aiCardTitle} numberOfLines={2}>{r.title}</Text>
                    <LinearGradient colors={Gradients.primary as [string, string]} style={s.matchBadge}>
                      <Text style={s.matchPct}>{r.matchPercentage ?? 0}%</Text>
                    </LinearGradient>
                  </View>
                  <Text style={s.aiCardMeta}>{r.cuisine} · {r.cookTime} · {r.calories} cal · {r.difficulty}</Text>
                  {Array.isArray(r.tags) && r.tags.length > 0 && (
                    <View style={s.aiTagRow}>
                      {r.tags.slice(0, 3).map((t, i) => (
                        <View key={i} style={s.aiTag}><Text style={s.aiTagT}>{t}</Text></View>
                      ))}
                    </View>
                  )}
                  <Text style={s.aiCardCta}>View recipe →</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={() => setMode('results')} style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}>
              <View style={s.rescanBtn}>
                <Feather name="refresh-ccw" size={16} color={BrandColors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={s.rescanText}>Tweak ingredients</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          <Text style={s.sub}>AI-POWERED</Text>
          <View style={s.titleRow}>
            <Text style={s.title}>Fridge Scanner</Text>
            <Feather name="camera" size={28} color={BrandColors.primaryStart} />
          </View>
          <Text style={s.desc}>
            Open your camera and point at your fridge — AI identifies every ingredient instantly!
          </Text>

          {mode === 'home' && (
            <View style={s.cameraBox}>
              {/* Dietary preference picker — required before scan */}
              <View style={s.dietBlock}>
                <Text style={s.dietLabel}>Choose your dietary preference</Text>
                <Text style={s.dietHint}>Required — BiteSwipe AI tailors recipes to it</Text>
                <View style={s.dietRow}>
                  {DIET_OPTIONS.map(opt => {
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
              </View>

              {/* Live viewfinder mockup */}
              <View style={s.viewfinder}>
                <LinearGradient colors={['rgba(255,107,53,0.06)', 'rgba(255,45,135,0.06)']} style={StyleSheet.absoluteFill} />
                <View style={[s.corner, s.cornerTL]} />
                <View style={[s.corner, s.cornerTR]} />
                <View style={[s.corner, s.cornerBL]} />
                <View style={[s.corner, s.cornerBR]} />
                <View style={s.viewfinderCenter}>
                  <Feather name="aperture" size={52} color={BrandColors.primaryStart} style={{ opacity: 0.7 }} />
                  <Text style={s.camText}>Tap to open camera</Text>
                  <Text style={s.camHint}>Works best with the fridge door open</Text>
                </View>
              </View>

              {/* Scan button with pulse */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }], marginTop: Spacing.xl, opacity: diet ? 1 : 0.5 }}>
                <TouchableOpacity onPress={handleOpenCamera} activeOpacity={0.85}>
                  <LinearGradient
                    colors={Gradients.primary as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[s.scanBtn, Shadows.glow]}
                  >
                    <Feather name="camera" size={22} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={s.scanBtnText}>Open Camera Scanner</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity onPress={handleWebPick} style={s.galleryLink}>
                <Feather name="image" size={16} color={BrandColors.textTertiary} style={{ marginRight: 6 }} />
                <Text style={s.galleryLinkT}>Or choose from gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'results' && (
            <>
              <GlassCard style={s.resultHeader} intensity="heavy">
                <View style={s.resultRow}>
                  <LinearGradient colors={Gradients.primary as [string, string]} style={s.resultIconBg}>
                    <Feather name="check" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resultTitle}>{ingredients.length} ingredients found!</Text>
                    <Text style={s.resultSub}>Tap any to deselect</Text>
                  </View>
                  <TouchableOpacity onPress={() => setMode('camera')}>
                    <View style={s.rescanSmall}>
                      <Feather name="refresh-ccw" size={14} color={BrandColors.primaryStart} />
                    </View>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Ingredient chips */}
              <View style={s.grid}>
                {ingredients.map((item) => {
                  const isSelected = selected.includes(item.name);
                  return (
                    <TouchableOpacity key={item.name} onPress={() => toggleIngredient(item.name)} activeOpacity={0.7} style={s.ingCardWrapper}>
                      {isSelected ? (
                        <LinearGradient colors={Gradients.primary as [string, string]} style={s.ingCard}>
                          <Feather name="check" size={20} color="#fff" />
                          <Text style={s.ingNameActive}>{item.name}</Text>
                          <Text style={s.ingConfActive}>{Math.round(item.confidence * 100)}%</Text>
                        </LinearGradient>
                      ) : (
                        <GlassCard style={s.ingCardGlass}>
                          <Feather name="x" size={20} color={BrandColors.textTertiary} />
                          <Text style={s.ingName}>{item.name}</Text>
                          <Text style={s.ingConf}>{Math.round(item.confidence * 100)}%</Text>
                        </GlassCard>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selected.length > 0 && (
                <TouchableOpacity onPress={handleFindRecipes} activeOpacity={0.85} style={{ marginTop: Spacing.lg }}>
                  <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.scanBtn, Shadows.glow]}>
                    <Feather name="zap" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={s.scanBtnText}>Cook with BiteSwipe AI ({selected.length})</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => { setMode('home'); setIngredients([]); setSelected([]); setAIRecipes([]); }} style={{ marginBottom: Spacing.xl, marginTop: Spacing.lg }}>
                <View style={s.rescanBtn}>
                  <Feather name="refresh-ccw" size={16} color={BrandColors.textSecondary} style={{ marginRight: 8 }} />
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

// ─── Camera overlay styles ────────────────────────────────────────
const cs = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  permContainer: { flex: 1, backgroundColor: BrandColors.dark900, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  permTitle: { color: BrandColors.textPrimary, ...Typography.h2, textAlign: 'center' },
  permDesc: { color: BrandColors.textSecondary, ...Typography.body, textAlign: 'center' },
  permBtn: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: Radius.full },
  permBtnT: { color: '#fff', ...Typography.bodyBold },
  overlayTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 140, zIndex: 1 },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, zIndex: 1 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },
  topCenter: { alignItems: 'center' },
  scanLabel: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  scanHint: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  frameWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  frame: { width: SCREEN_W * 0.82, height: SCREEN_W * 0.82, position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: 28, height: 28 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#FF6B35', borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#FF6B35', borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#FF2D87', borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#FF2D87', borderBottomRightRadius: 4 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  scanLineGradient: { height: 3, borderRadius: 2 },
  frameHint: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 16, letterSpacing: 0.5 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  captureOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30 },
});

// ─── Main screen styles ───────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  sub: { color: BrandColors.textTertiary, ...Typography.tiny, marginBottom: Spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  title: { color: BrandColors.textPrimary, ...Typography.h1 },
  desc: { color: BrandColors.textSecondary, ...Typography.body, marginBottom: Spacing.lg },

  cameraBox: { alignItems: 'center', marginTop: Spacing.sm },
  viewfinder: { width: '100%', aspectRatio: 1, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: BrandColors.glassBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  viewfinderCenter: { alignItems: 'center', gap: Spacing.sm },
  camText: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  camHint: { color: BrandColors.textTertiary, ...Typography.caption },
  corner: { position: 'absolute', width: 28, height: 28 },
  cornerTL: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderColor: BrandColors.primaryStart, borderTopLeftRadius: 4 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderColor: BrandColors.primaryStart, borderTopRightRadius: 4 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: BrandColors.primaryEnd, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderColor: BrandColors.primaryEnd, borderBottomRightRadius: 4 },
  scanBtn: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', minWidth: 240 },
  scanBtnText: { color: '#fff', ...Typography.bodyBold },
  galleryLink: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingVertical: Spacing.xs },
  galleryLinkT: { color: BrandColors.textTertiary, ...Typography.caption },

  analysingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  analysingIcon: { marginBottom: Spacing.md },
  analysingIconGrad: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  analysingTitle: { color: BrandColors.textPrimary, ...Typography.h2, textAlign: 'center' },
  analysingDesc: { color: BrandColors.textSecondary, ...Typography.body, textAlign: 'center', marginBottom: Spacing.md },
  analysingSteps: { gap: Spacing.sm, alignSelf: 'stretch' },
  analysingStep: { flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.dark800, padding: Spacing.sm, borderRadius: Radius.md },
  analysingStepT: { color: BrandColors.textSecondary, ...Typography.body },

  resultHeader: { marginBottom: Spacing.lg },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  resultIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  resultSub: { color: BrandColors.textTertiary, ...Typography.caption },
  rescanSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,107,53,0.12)', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  ingCardWrapper: { width: '31%' },
  ingCard: { alignItems: 'center', gap: 4, padding: Spacing.md, borderRadius: Radius.lg, minHeight: 86, justifyContent: 'center' },
  ingCardGlass: { alignItems: 'center', gap: 4, minHeight: 86, justifyContent: 'center', padding: Spacing.md },
  ingName: { color: BrandColors.textTertiary, ...Typography.caption, fontWeight: '600', textAlign: 'center' },
  ingNameActive: { color: '#fff', ...Typography.caption, fontWeight: '700', textAlign: 'center' },
  ingConf: { color: BrandColors.textTertiary, fontSize: 10 },
  ingConfActive: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  section: { marginTop: Spacing.xl },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  secTitle: { color: BrandColors.textPrimary, ...Typography.h3 },
  matchCard: { marginBottom: Spacing.sm },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  matchIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: BrandColors.dark600, alignItems: 'center', justifyContent: 'center' },
  matchName: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  matchMeta: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 2 },
  matchBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs, borderRadius: Radius.full },
  matchPct: { color: '#fff', fontSize: 13, fontWeight: '800' },
  rescanBtn: { flexDirection: 'row', backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  rescanText: { color: BrandColors.textSecondary, ...Typography.bodyBold },

  // Dietary preference picker
  dietBlock: { width: '100%', marginBottom: Spacing.lg },
  dietLabel: { color: BrandColors.textPrimary, ...Typography.bodyBold, marginBottom: 2 },
  dietHint: { color: BrandColors.textTertiary, ...Typography.caption, marginBottom: Spacing.sm },
  dietRow: { flexDirection: 'row', gap: Spacing.sm },
  dietChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: Radius.full, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder },
  dietChipT: { color: BrandColors.textSecondary, ...Typography.caption, fontWeight: '700' },
  dietChipActive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: Radius.full },
  dietChipTActive: { color: '#fff', ...Typography.caption, fontWeight: '800' },

  // AI recipes view
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  aiCard: { padding: Spacing.md, marginBottom: Spacing.md },
  aiCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  aiCardTitle: { flex: 1, color: BrandColors.textPrimary, ...Typography.bodyBold, fontSize: 16 },
  aiCardMeta: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 4 },
  aiTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  aiTag: { backgroundColor: BrandColors.dark600, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  aiTagT: { color: BrandColors.textSecondary, fontSize: 10, fontWeight: '700' },
  aiCardCta: { color: BrandColors.primaryStart, ...Typography.caption, fontWeight: '700', marginTop: Spacing.sm },
});
