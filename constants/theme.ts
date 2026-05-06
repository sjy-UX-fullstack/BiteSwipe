/**
 * BiteSwipe Design System
 * Premium dark-mode glassmorphism theme with vibrant accent gradients.
 */

import { Platform } from 'react-native';

// ─── Brand Palette ───────────────────────────────────────────────
export const BrandColors = {
  // Primary gradient (fiery orange → hot pink)
  primaryStart: '#FF6B35',
  primaryEnd: '#FF2D87',

  // Secondary gradient (electric teal → cyan)
  secondaryStart: '#00D4AA',
  secondaryEnd: '#00B4D8',

  // Accent (golden for highlights & badges)
  accent: '#FFD166',
  accentAlt: '#FFC233',

  // Success / Error
  success: '#06D6A0',
  error: '#EF476F',
  warning: '#FFD166',

  // Neutrals (dark-first palette)
  dark900: '#0A0A0F',
  dark800: '#12121A',
  dark700: '#1A1A26',
  dark600: '#222233',
  dark500: '#2E2E42',
  dark400: '#3D3D56',

  // Glass surfaces
  glass: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassHover: 'rgba(255, 255, 255, 0.12)',

  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textTertiary: 'rgba(255, 255, 255, 0.44)',
  textMuted: 'rgba(255, 255, 255, 0.28)',
};

// ─── Spacing Scale ───────────────────────────────────────────────
export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ─── Border Radius ───────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// ─── Typography ──────────────────────────────────────────────────
export const Typography = {
  hero: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  tiny: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    lineHeight: 14,
  },
};

// ─── Shadow System ───────────────────────────────────────────────
export const Shadows = {
  glow: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ─── Gradients (for LinearGradient components) ───────────────────
export const Gradients = {
  primary: [BrandColors.primaryStart, BrandColors.primaryEnd],
  secondary: [BrandColors.secondaryStart, BrandColors.secondaryEnd],
  dark: [BrandColors.dark900, BrandColors.dark800],
  cardOverlay: ['transparent', 'rgba(0,0,0,0.85)'],
  hero: ['rgba(10,10,15,0)', 'rgba(10,10,15,0.6)', BrandColors.dark900],
};

// ─── Legacy Colors Export (for existing components) ──────────────
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: BrandColors.primaryStart,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: BrandColors.primaryStart,
  },
  dark: {
    text: BrandColors.textPrimary,
    background: BrandColors.dark900,
    tint: BrandColors.primaryStart,
    icon: BrandColors.textTertiary,
    tabIconDefault: BrandColors.textTertiary,
    tabIconSelected: BrandColors.primaryStart,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
