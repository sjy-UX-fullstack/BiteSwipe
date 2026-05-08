/**
 * VideoEmbed — platform-aware video player.
 * Web: embeds the video via <iframe> in a 9:16 box.
 * Native: shows thumbnail with a "Watch on YouTube" button (opens the original URL).
 *
 * Avoids pulling in react-native-webview just for native video playback —
 * native users get redirected to the YouTube/Instagram app, which feels more
 * native than an in-app webview anyway.
 */
import React from 'react';
import { Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  source: 'youtube' | 'instagram';
  embedUrl?: string;
  originalUrl?: string;
  thumbnail?: string;
  title?: string;
  /** Aspect: defaults to portrait 9:16 for shorts/reels. Pass 16/9 for landscape. */
  aspect?: number;
}

export default function VideoEmbed({
  source, embedUrl, originalUrl, thumbnail, title, aspect = 9 / 16,
}: Props) {
  const openExternal = () => {
    if (originalUrl) Linking.openURL(originalUrl);
  };

  if (Platform.OS === 'web' && embedUrl) {
    return (
      <View style={[styles.frame, { aspectRatio: aspect }]}>
        {/* @ts-ignore — RN ignores raw HTML on web; iframe fallback for SSR is fine */}
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ border: 0, width: '100%', height: '100%', borderRadius: Radius.lg }}
          title={title ?? 'Recipe video'}
        />
      </View>
    );
  }

  // Native fallback: thumbnail + tap-to-open
  return (
    <TouchableOpacity onPress={openExternal} activeOpacity={0.85}>
      <View style={[styles.frame, { aspectRatio: aspect }]}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['rgba(255,107,53,0.2)', 'rgba(255,45,135,0.2)']}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <View style={styles.overlay}>
          <View style={styles.playButton}>
            <Feather name="play" size={28} color="#fff" />
          </View>
          <View style={styles.openPill}>
            <Feather
              name={source === 'youtube' ? 'youtube' : 'instagram'}
              size={12}
              color="#fff"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.openPillT}>Watch on {source === 'youtube' ? 'YouTube' : 'Instagram'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    backgroundColor: BrandColors.dark800,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BrandColors.glassBorder,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  openPill: {
    position: 'absolute', bottom: Spacing.md, right: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  openPillT: { color: '#fff', ...Typography.caption, fontWeight: '700' },
});
