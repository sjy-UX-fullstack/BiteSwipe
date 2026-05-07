/**
 * Cook Mode — Full-screen step-by-step cooking guide with timer.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';

const { width: SW } = Dimensions.get('window');

export default function CookModeScreen() {
  const router = useRouter();
  const { title, steps: stepsJson } = useLocalSearchParams<{ title: string; steps: string }>();
  const steps: string[] = JSON.parse(stepsJson || '[]');

  const [currentStep, setCurrentStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [done, setDone] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const animateStep = (direction: 'next' | 'prev') => {
    const toVal = direction === 'next' ? -30 : 30;
    slideAnim.setValue(toVal);
    Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
  };

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      animateStep('next');
      setCurrentStep(s => s + 1);
      setTimerSeconds(0);
      setTimerRunning(false);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDone(true);
    }
  }, [currentStep, steps.length]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      animateStep('prev');
      setCurrentStep(s => s - 1);
      setTimerSeconds(0);
      setTimerRunning(false);
    }
  }, [currentStep]);

  const handleExit = () => {
    if (timerRunning || currentStep > 0) {
      if (Platform.OS === 'web') {
        if (window.confirm('Exit cooking? Your progress will be lost.')) router.back();
      } else {
        Alert.alert('Exit Cook Mode', 'Are you sure? Your progress will be lost.', [
          { text: 'Stay', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() },
        ]);
      }
    } else {
      router.back();
    }
  };

  const progress = steps.length > 0 ? (currentStep + 1) / steps.length : 1;

  if (steps.length === 0) {
    return (
      <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Feather name="alert-circle" size={48} color={BrandColors.textTertiary} />
        <Text style={[s.stepText, { textAlign: 'center', marginTop: Spacing.md }]}>No steps found for this recipe.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.xl }}>
          <Text style={{ color: BrandColors.primaryStart, ...Typography.bodyBold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    return (
      <View style={s.screen}>
        <SafeAreaView style={s.doneContainer}>
          <LinearGradient colors={['rgba(6,214,160,0.1)', BrandColors.dark900]} style={StyleSheet.absoluteFill} />
          <Feather name="check-circle" size={80} color={BrandColors.success} />
          <Text style={s.doneTitle}>You nailed it! 🎉</Text>
          <Text style={s.doneSub}>"{title}" is ready to serve</Text>
          <Text style={s.doneTime}>Total time: {formatTime(timerSeconds)}</Text>

          <View style={s.doneActions}>
            <TouchableOpacity
              style={s.doneSecondary}
              onPress={() => { setDone(false); setCurrentStep(0); setTimerSeconds(0); }}
            >
              <Feather name="rotate-ccw" size={16} color={BrandColors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={s.doneSecondaryT}>Cook Again</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={{ flex: 1 }}>
              <LinearGradient colors={Gradients.primary as [string, string]} style={s.donePrimary}>
                <Text style={s.donePrimaryT}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleExit} style={s.exitBtn}>
            <Feather name="x" size={22} color={BrandColors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          </View>
          {/* Timer toggle */}
          <TouchableOpacity
            onPress={() => setTimerRunning(r => !r)}
            style={[s.timerToggle, timerRunning && s.timerToggleActive]}
          >
            <Feather name={timerRunning ? 'pause' : 'play'} size={16} color={timerRunning ? '#fff' : BrandColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={s.progressBar}>
          <Animated.View style={[s.progressFill, { width: `${progress * 100}%` }]}>
            <LinearGradient colors={Gradients.primary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>

        {/* Step Counter */}
        <View style={s.stepCounterRow}>
          <Text style={s.stepCounter}>Step {currentStep + 1} of {steps.length}</Text>
          {timerRunning || timerSeconds > 0 ? (
            <View style={s.timerDisplay}>
              <Feather name="clock" size={12} color={BrandColors.accent} style={{ marginRight: 4 }} />
              <Text style={s.timerText}>{formatTime(timerSeconds)}</Text>
            </View>
          ) : null}
        </View>

        {/* Step Content */}
        <View style={s.stepContainer}>
          <Animated.View style={[s.stepCard, { transform: [{ translateX: slideAnim }] }]}>
            <LinearGradient
              colors={['rgba(255,107,53,0.06)', 'rgba(255,45,135,0.04)', 'transparent']}
              style={s.stepCardGradient}
            >
              <View style={s.stepNumberBadge}>
                <LinearGradient colors={Gradients.primary as [string, string]} style={s.stepNumberGrad}>
                  <Text style={s.stepNumberText}>{currentStep + 1}</Text>
                </LinearGradient>
              </View>
              <Text style={s.stepText}>{steps[currentStep]}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Upcoming step preview */}
          {currentStep < steps.length - 1 && (
            <View style={s.nextPreview}>
              <Text style={s.nextPreviewLabel}>NEXT</Text>
              <Text style={s.nextPreviewText} numberOfLines={2}>{steps[currentStep + 1]}</Text>
            </View>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={s.navRow}>
          <TouchableOpacity
            onPress={goPrev}
            disabled={currentStep === 0}
            style={[s.navBtn, currentStep === 0 && s.navBtnDisabled]}
          >
            <Feather name="chevron-left" size={28} color={currentStep === 0 ? BrandColors.textTertiary : BrandColors.textPrimary} />
          </TouchableOpacity>

          {/* Timer control centre button */}
          <TouchableOpacity
            onPress={() => setTimerRunning(r => !r)}
            style={s.timerCentreBtn}
          >
            <View style={s.timerCentre}>
              <Feather name={timerRunning ? 'pause-circle' : 'play-circle'} size={22} color={BrandColors.accent} />
              <Text style={s.timerCentreLabel}>{timerRunning ? 'Pause' : 'Timer'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goNext}
            style={s.nextBtn}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Gradients.primary as [string, string]} style={s.nextBtnGrad}>
              {currentStep < steps.length - 1 ? (
                <>
                  <Text style={s.nextBtnText}>Next</Text>
                  <Feather name="chevron-right" size={24} color="#fff" />
                </>
              ) : (
                <>
                  <Feather name="check" size={22} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={s.nextBtnText}>Done!</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  exitBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  timerToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: BrandColors.glass, borderWidth: 1, borderColor: BrandColors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  timerToggleActive: { backgroundColor: BrandColors.primaryStart, borderColor: BrandColors.primaryStart },
  progressBar: { height: 4, backgroundColor: BrandColors.dark600, marginHorizontal: Spacing.lg, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  stepCounterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  stepCounter: { color: BrandColors.textTertiary, ...Typography.caption },
  timerDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,209,102,0.1)', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  timerText: { color: BrandColors.accent, fontWeight: '700', fontSize: 13 },
  stepContainer: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center', gap: Spacing.lg },
  stepCard: { borderRadius: Radius.xxl, overflow: 'hidden', borderWidth: 1, borderColor: BrandColors.glassBorder },
  stepCardGradient: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.lg },
  stepNumberBadge: { alignSelf: 'center' },
  stepNumberGrad: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  stepText: { color: BrandColors.textPrimary, fontSize: 20, fontWeight: '500', lineHeight: 30, textAlign: 'center' },
  nextPreview: { backgroundColor: BrandColors.dark800, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: BrandColors.glassBorder },
  nextPreviewLabel: { color: BrandColors.textTertiary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  nextPreviewText: { color: BrandColors.textSecondary, ...Typography.body },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  navBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: BrandColors.dark700, borderWidth: 1, borderColor: BrandColors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  timerCentreBtn: { alignItems: 'center' },
  timerCentre: { alignItems: 'center', gap: 4 },
  timerCentreLabel: { color: BrandColors.accent, fontSize: 11, fontWeight: '700' },
  nextBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  nextBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  nextBtnText: { color: '#fff', ...Typography.bodyBold, fontSize: 16 },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxl },
  doneTitle: { color: BrandColors.textPrimary, ...Typography.h1, textAlign: 'center' },
  doneSub: { color: BrandColors.textSecondary, ...Typography.body, textAlign: 'center' },
  doneTime: { color: BrandColors.accent, ...Typography.bodyBold },
  doneActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, width: '100%' },
  doneSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.dark800, borderWidth: 1, borderColor: BrandColors.glassBorder, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.full },
  doneSecondaryT: { color: BrandColors.textSecondary, ...Typography.bodyBold },
  donePrimary: { paddingVertical: Spacing.md, borderRadius: Radius.full, alignItems: 'center' },
  donePrimaryT: { color: '#fff', ...Typography.bodyBold, fontSize: 16 },
});
