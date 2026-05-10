import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      showError('Error', 'Please enter your name.');
      return;
    }
    if (!email || !password) {
      showError('Error', 'Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      showError('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name.trim());
    } catch (e: any) {
      showError('Signup Failed', e.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      showError('Google Signup Failed', e.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[BrandColors.dark900, BrandColors.dark800]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>

            {/* Logo / Brand */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FF6B35', '#FF2D87']}
                style={styles.logoCircle}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="restaurant" size={36} color="#fff" />
              </LinearGradient>
              <Text style={styles.brand}>BiteSwipe</Text>
              <Text style={styles.brandTagline}>Join the food community</Text>
            </View>

            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create Account 🍳</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={BrandColors.textSecondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={BrandColors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={BrandColors.textSecondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={BrandColors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={BrandColors.textSecondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor={BrandColors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
              </View>

              <Text style={styles.privacyNote}>
                We'll personalize your recipes — no spam, no ads, your data stays private.
              </Text>

              <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
                <LinearGradient colors={['#FF6B35', '#FF2D87']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.signupButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup} disabled={loading}>
              <Ionicons name="logo-google" size={20} color={BrandColors.textPrimary} style={{ marginRight: 10 }} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.dark900 },
  scroll: { flexGrow: 1 },
  content: { flex: 1, padding: 28, justifyContent: 'center', minHeight: 600 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B35', shadowOpacity: 0.5, shadowRadius: 20,
  },
  brand: { fontSize: 28, fontWeight: '800', color: BrandColors.textPrimary, letterSpacing: 0.5 },
  brandTagline: { fontSize: 13, color: BrandColors.textSecondary, marginTop: 4 },
  headerContainer: { marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: BrandColors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: BrandColors.textSecondary },
  formContainer: { marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BrandColors.dark800, borderRadius: 14,
    marginBottom: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: BrandColors.glassBorder,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, height: 56, color: BrandColors.textPrimary, fontSize: 16 },
  privacyNote: {
    fontSize: 12, color: BrandColors.textTertiary,
    textAlign: 'center', marginTop: 4, marginBottom: 4,
    lineHeight: 16,
  },
  signupButton: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  gradientBtn: { height: 56, justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  signupButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  divider: { flex: 1, height: 1, backgroundColor: BrandColors.glassBorder },
  dividerText: { color: BrandColors.textSecondary, paddingHorizontal: 16, fontSize: 13 },
  googleButton: {
    flexDirection: 'row', backgroundColor: BrandColors.dark800,
    borderRadius: 14, height: 56, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: BrandColors.glassBorder,
  },
  googleButtonText: { color: BrandColors.textPrimary, fontSize: 15, fontWeight: '600' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: BrandColors.textSecondary, fontSize: 14 },
  loginText: { color: '#FF6B35', fontSize: 14, fontWeight: '700' },
});
