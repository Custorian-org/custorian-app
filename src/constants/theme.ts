/**
 * Custorian Design System
 * Matches the website aesthetic: dark, minimal, premium.
 * Inspired by custorian.org — deep blacks, subtle borders, accent violet.
 */

export const Colors = {
  // Core palette (matches website)
  bg: '#08080c',
  bg2: '#0e0e14',
  bg3: '#16161e',
  surface: '#1a1a24',
  surfaceLight: '#22222e',

  // Text
  text: '#f4f4f5',
  textDim: 'rgba(244,244,245,0.6)',
  textMute: 'rgba(244,244,245,0.3)',

  // Accent
  accent: '#a78bfa',       // violet
  accentDim: '#7c3aed',

  // Status
  safe: '#10b981',         // emerald
  warning: '#f59e0b',      // amber
  danger: '#ef4444',       // red
  info: '#3b82f6',         // blue

  // Semantic
  grooming: '#ef4444',
  bullying: '#f59e0b',
  selfHarm: '#a78bfa',
  violence: '#ef4444',
  wellness: '#d946ef',
  purchase: '#f97316',

  // UI
  border: 'rgba(244,244,245,0.08)',
  borderLight: 'rgba(244,244,245,0.15)',
  card: 'rgba(244,244,245,0.03)',
  cardHover: 'rgba(244,244,245,0.06)',

  // Legacy compatibility
  primary: '#a78bfa',
  secondary: '#10b981',
  white: '#f4f4f5',
  black: '#08080c',
  purple: '#a78bfa',
  deepOrange: '#f97316',
  darkSurface: '#08080c',
  textLight: 'rgba(244,244,245,0.4)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 100,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -1 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 2, textTransform: 'uppercase' as const },
};
