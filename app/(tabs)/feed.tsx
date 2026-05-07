/**
 * Feed Screen — "Nailed It or Failed It" Community.
 */
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import GlassCard from '@/components/ui/GlassCard';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_FEED, FeedPost } from '@/constants/mock-data';

type FeedState = FeedPost & { likeCount: number; savedLocally: boolean };

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedState[]>(() =>
    MOCK_FEED.map(p => ({ ...p, likeCount: p.likes, savedLocally: false }))
  );

  const toggleLike = useCallback((id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const wasLiked = p.isLiked;
      return { ...p, isLiked: !wasLiked, likeCount: wasLiked ? p.likeCount - 1 : p.likeCount + 1 };
    }));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, savedLocally: !p.savedLocally } : p
    ));
  }, []);

  const handleComment = useCallback((post: FeedState) => {
    if (Platform.OS === 'web') {
      window.alert(`Comments for "${post.recipeName}" coming soon!`);
    } else {
      Alert.alert('Comments', `Comments for "${post.recipeName}" are coming in the next update!`);
    }
  }, []);

  const handleShare = useCallback((post: FeedState) => {
    if (Platform.OS === 'web') {
      window.alert(`Share "${post.recipeName}" — share functionality coming soon!`);
    } else {
      Alert.alert('Share', `Share "${post.recipeName}" — coming soon!`);
    }
  }, []);

  const handlePost = () => {
    if (Platform.OS === 'web') {
      window.alert('Post your dish — photo upload coming in the next update!');
    } else {
      Alert.alert('Post a Dish', 'Share your cooking attempt! Photo upload coming in the next update.');
    }
  };

  const handleStoryTap = (name: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${name}'s story — coming soon!`);
    } else {
      Alert.alert("Story", `${name}'s story coming soon!`);
    }
  };

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.sub}>COMMUNITY</Text>
            <View style={s.titleRow}>
              <Text style={s.title}>Nailed It or Failed It</Text>
              <Feather name="users" size={24} color={BrandColors.primaryStart} />
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={handlePost}>
            <LinearGradient colors={Gradients.primary as [string, string]} style={s.postBtn}>
              <Feather name="plus" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={s.postBtnT}>Post</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {/* Stories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.storiesRow}>
            <TouchableOpacity style={s.storyWrap} onPress={handlePost} activeOpacity={0.7}>
              <View style={[s.storyRing, { borderColor: BrandColors.dark500 }]}>
                <LinearGradient colors={['#FF6B35', '#FF6B35']} style={s.storyInner}>
                  <Feather name="plus" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={s.storyT}>Your dish</Text>
            </TouchableOpacity>
            {['Priya', 'Arjun', 'Meera', 'Rohan'].map((name, i) => (
              <TouchableOpacity key={name} style={s.storyWrap} onPress={() => handleStoryTap(name)} activeOpacity={0.7}>
                <LinearGradient
                  colors={i % 2 === 0 ? (Gradients.primary as [string, string]) : ['#FF2D87', '#9B2DFF']}
                  style={s.storyRingG}
                >
                  <View style={s.storyInner}>
                    <Feather name="user" size={20} color={BrandColors.textSecondary} />
                  </View>
                </LinearGradient>
                <Text style={s.storyT}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Feed Posts */}
          <View style={s.feed}>
            {posts.map((post) => (
              <GlassCard key={post.id} style={s.postCard}>
                {/* Post Header */}
                <View style={s.pHeader}>
                  <View style={s.pAvatar}>
                    <Feather name="user" size={16} color={BrandColors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pName}>{post.userName}</Text>
                    <Text style={s.pTime}>{post.timeAgo}</Text>
                  </View>
                  <View style={[
                    s.pBadge,
                    { backgroundColor: post.badge?.includes('Nailed') ? 'rgba(46,213,115,0.15)' : 'rgba(255,71,87,0.15)' }
                  ]}>
                    <Text style={[
                      s.pBadgeT,
                      { color: post.badge?.includes('Nailed') ? BrandColors.success : BrandColors.error }
                    ]}>
                      {post.badge}
                    </Text>
                  </View>
                </View>

                {/* Post Image */}
                <View style={s.pImgWrap}>
                  <Image
                    source={typeof post.image === 'string' ? { uri: post.image } : post.image}
                    style={s.pImg}
                    resizeMode="cover"
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={s.pImgOverlay}>
                    <View style={s.pRecipeTag}>
                      <Feather name={post.icon as any} size={12} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={s.pRecipeTagT}>{post.recipeName}</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Post Content */}
                <View style={s.pContent}>
                  <Text style={s.pCaption}>
                    <Text style={s.pNameBold}>{post.userName}</Text> {post.caption}
                  </Text>

                  {/* Actions */}
                  <View style={s.pActions}>
                    <View style={s.pActionRow}>
                      <TouchableOpacity style={s.pActionBtn} onPress={() => toggleLike(post.id)} activeOpacity={0.7}>
                        <View style={[s.heartIcon, post.isLiked && s.heartIconLiked]}>
                          <Feather
                            name="heart"
                            size={22}
                            color={post.isLiked ? '#fff' : BrandColors.textPrimary}
                          />
                        </View>
                        <Text style={[s.pActionNum, post.isLiked && { color: BrandColors.error }]}>
                          {post.likeCount}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={s.pActionBtn} onPress={() => handleComment(post)} activeOpacity={0.7}>
                        <Feather name="message-circle" size={24} color={BrandColors.textPrimary} />
                        <Text style={s.pActionNum}>{post.comments}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={s.pActionBtn} onPress={() => handleShare(post)} activeOpacity={0.7}>
                        <Feather name="send" size={24} color={BrandColors.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => toggleSave(post.id)} activeOpacity={0.7}>
                      <Feather
                        name="bookmark"
                        size={24}
                        color={post.savedLocally ? BrandColors.primaryStart : BrandColors.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  sub: { color: BrandColors.textTertiary, ...Typography.tiny, marginBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { color: BrandColors.textPrimary, ...Typography.h2 },
  postBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  postBtnT: { color: '#fff', ...Typography.bodyBold },
  scroll: { paddingBottom: Spacing.xxl },
  storiesRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  storyWrap: { alignItems: 'center', gap: Spacing.xs },
  storyRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  storyRingG: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  storyInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: BrandColors.dark800, borderWidth: 3, borderColor: BrandColors.dark900, alignItems: 'center', justifyContent: 'center' },
  storyT: { color: BrandColors.textSecondary, fontSize: 11, fontWeight: '500' },
  feed: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, marginTop: Spacing.sm },
  postCard: { padding: 0, overflow: 'hidden' },
  pHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, gap: Spacing.sm },
  pAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: BrandColors.dark500, alignItems: 'center', justifyContent: 'center' },
  pName: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  pTime: { color: BrandColors.textTertiary, ...Typography.caption, fontSize: 11 },
  pBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  pBadgeT: { fontSize: 11, fontWeight: '700' },
  pImgWrap: { width: '100%', aspectRatio: 1 },
  pImg: { width: '100%', height: '100%', position: 'absolute' },
  pImgOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: Spacing.sm },
  pRecipeTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full },
  pRecipeTagT: { color: '#fff', fontSize: 12, fontWeight: '600' },
  pContent: { padding: Spacing.md },
  pCaption: { color: BrandColors.textSecondary, ...Typography.body, lineHeight: 20, marginBottom: Spacing.md },
  pNameBold: { color: BrandColors.textPrimary, fontWeight: '700' },
  pActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pActionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  pActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pActionNum: { color: BrandColors.textPrimary, ...Typography.bodyBold },
  heartIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  heartIconLiked: { backgroundColor: BrandColors.error },
});
