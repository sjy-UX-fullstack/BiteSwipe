/**
 * User Profile Modal
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { BrandColors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { countSaved } from '@/services/savedRecipes';
import { countCooked } from '@/services/cookHistory';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [cookedCount, setCookedCount] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [s, c] = await Promise.all([countSaved(), countCooked()]);
      setSavedCount(s);
      setCookedCount(c);
    })();
  }, []));

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Chef';
  const handle = '@' + (user?.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    const confirm = async () => {
      try {
        await signOut();
        router.replace('/login');
      } catch (e: any) {
        const msg = e.message || 'Failed to log out.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Log out of BiteSwipe?')) confirm();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: confirm },
      ]);
    }
  };

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <View style={s.header}>
          <LinearGradient colors={Gradients.primary as [string, string]} style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={s.name}>{displayName}</Text>
          <Text style={s.handle}>{handle}</Text>
          {user?.email && <Text style={s.email}>{user.email}</Text>}

          <View style={s.stats}>
            <TouchableOpacity style={s.stat} onPress={() => router.push('/saved' as any)}>
              <Text style={s.statV}>{cookedCount ?? '–'}</Text>
              <Text style={s.statL}>Cooked</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.stat} onPress={() => router.push('/saved' as any)}>
              <Text style={s.statV}>{savedCount ?? '–'}</Text>
              <Text style={s.statL}>Saved</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <View style={s.stat}>
              <Text style={s.statV}>—</Text>
              <Text style={s.statL}>Posts</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>My BiteSwipe</Text>

        <View style={s.menu}>
          <TouchableOpacity style={s.menuItem} onPress={() => router.push('/saved' as any)}>
            <Feather name="bookmark" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Saved Recipes</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem} onPress={() => router.push('/shopping-list' as any)}>
            <Feather name="shopping-cart" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Shopping List</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem} onPress={() => router.push('/meal-planner' as any)}>
            <Feather name="calendar" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Weekly Meal Planner</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem} onPress={() => router.push('/preferences' as any)}>
            <Feather name="heart" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Dietary Preferences</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem} onPress={() => {
            if (Platform.OS === 'web') window.alert('Notifications coming soon!');
            else Alert.alert('Coming Soon', 'Notification settings will be available in the next update.');
          }}>
            <Feather name="bell" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Notifications</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.menuItem, s.menuItemLast]} onPress={() => {
            if (Platform.OS === 'web') window.alert('Account settings coming soon!');
            else Alert.alert('Coming Soon', 'Account & security settings coming soon.');
          }}>
            <Feather name="shield" size={20} color={BrandColors.textSecondary} />
            <Text style={s.menuT}>Account & Security</Text>
            <Feather name="chevron-right" size={20} color={BrandColors.textTertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={BrandColors.error} style={{ marginRight: 8 }} />
          <Text style={s.logoutT}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.dark900 },
  scroll: { padding: Spacing.lg },
  header: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.xxl },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { color: BrandColors.textPrimary, ...Typography.h1 },
  handle: { color: BrandColors.textSecondary, ...Typography.body },
  email: { color: BrandColors.textTertiary, ...Typography.caption, marginTop: 4 },
  stats: { flexDirection: 'row', backgroundColor: BrandColors.dark800, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.lg, width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statV: { color: BrandColors.textPrimary, ...Typography.h2 },
  statL: { color: BrandColors.textTertiary, ...Typography.caption },
  divider: { width: 1, backgroundColor: BrandColors.glassBorder },
  sectionTitle: { color: BrandColors.textPrimary, ...Typography.h3, marginBottom: Spacing.md },
  menu: { backgroundColor: BrandColors.dark800, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.xl },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: BrandColors.glassBorder },
  menuItemLast: { borderBottomWidth: 0 },
  menuT: { flex: 1, color: BrandColors.textPrimary, ...Typography.bodyBold, marginLeft: Spacing.md },
  logoutBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,71,87,0.1)', paddingVertical: Spacing.md, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  logoutT: { color: BrandColors.error, ...Typography.bodyBold },
});
