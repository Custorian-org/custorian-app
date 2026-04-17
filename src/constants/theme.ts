/**
 * Custorian Design System v4
 * Inspired by Headspace — soft, warm, calming, rounded.
 * Custorian purple palette. Maximum breathing room.
 * Feels like a safe space, not a surveillance tool.
 */

export const Colors = {
  // Backgrounds — warm, soft
  bg: '#FAF8FF',             // very soft purple-tinted white
  bg2: '#FFFFFF',            // pure white cards
  bg3: '#F3F0FA',            // soft lavender for sections

  // Brand — warm purple
  accent: '#7c3aed',        // violet — primary
  accentLight: '#ede9fe',    // soft violet tint
  accentSoft: '#f5f3ff',     // very soft violet for cards
  accentDark: '#5b21b6',     // pressed state

  // Navy (softer)
  navy: '#2d2b55',
  navyLight: '#4a4578',

  // Status — gentle, not alarming
  safe: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',

  // Text — softer contrast
  text: '#2d2b55',           // soft navy, not harsh black
  textDim: '#7c7a9a',        // muted purple-gray
  textMute: '#aba9c3',       // very muted
  textOnDark: '#f4f4f5',
  textOnAccent: '#ffffff',

  // UI — softer borders
  border: '#eae8f0',         // subtle purple-tinted border
  borderLight: '#f5f3fa',
  card: '#ffffff',
  shadow: 'rgba(124,58,237,0.06)', // purple-tinted shadow

  // Category colors
  grooming: '#ef4444',
  bullying: '#f59e0b',
  selfHarm: '#8b5cf6',
  violence: '#dc2626',
  wellness: '#d946ef',
  purchase: '#f97316',

  // Legacy
  primary: '#7c3aed',
  secondary: '#10b981',
  white: '#ffffff',
  black: '#2d2b55',
  purple: '#7c3aed',
  deepOrange: '#f97316',
  darkSurface: '#2d2b55',
  textLight: '#aba9c3',
  info: '#3b82f6',
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
  sm: 12,       // was 8 — rounder
  md: 16,       // was 12
  lg: 24,       // was 16 — much rounder
  xl: 32,       // was 20
  pill: 100,
};

export const Shadow = {
  sm: {
    shadowColor: '#7c3aed',   // purple-tinted shadows
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  md: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  lg: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
};

// Headspace-style gradient backgrounds for cards
export const Gradients = {
  warmPurple: ['#f5f3ff', '#ede9fe'],
  softGreen: ['#f0fdf4', '#dcfce7'],
  gentleAmber: ['#fffbeb', '#fef3c7'],
  calmBlue: ['#eff6ff', '#dbeafe'],
  softPink: ['#fdf2f8', '#fce7f3'],
};
