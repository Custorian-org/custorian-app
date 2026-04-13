/**
 * Custorian Design System v3
 * Inspired by Blueline (A' Design Award) — adapted for child safety.
 * Light, clean, institutional. Single accent color. Maximum clarity.
 * Consistent with custorian.org website typography (Space Grotesk + Inter).
 */

export const Colors = {
  // Backgrounds
  bg: '#F5F7FA',           // light gray — main background
  bg2: '#FFFFFF',          // white — cards
  bg3: '#EEF1F5',          // slightly darker gray — section dividers

  // Brand
  accent: '#7c3aed',       // violet — the ONE brand color
  accentLight: '#ede9fe',   // violet tint for backgrounds
  accentDark: '#5b21b6',   // violet dark for pressed states

  // Navy (for headers/hero sections like Blueline)
  navy: '#1a1a2e',
  navyLight: '#2d2d44',

  // Status — only two status colors
  safe: '#10b981',         // green — all clear
  danger: '#ef4444',       // red — alert/threat
  warning: '#f59e0b',      // amber — medium severity (minimal use)

  // Text
  text: '#1a1a2e',         // near-black navy
  textDim: '#6b7280',      // gray-500
  textMute: '#9ca3af',     // gray-400
  textOnDark: '#f4f4f5',   // white text on dark backgrounds
  textOnAccent: '#ffffff',  // white text on accent backgrounds

  // UI
  border: '#e5e7eb',       // gray-200
  borderLight: '#f3f4f6',  // gray-100
  card: '#ffffff',
  shadow: 'rgba(0,0,0,0.06)',

  // Category colors (subtle, used sparingly)
  grooming: '#ef4444',
  bullying: '#f59e0b',
  selfHarm: '#8b5cf6',
  violence: '#dc2626',
  wellness: '#d946ef',
  purchase: '#f97316',

  // Legacy compatibility
  primary: '#7c3aed',
  secondary: '#10b981',
  white: '#ffffff',
  black: '#1a1a2e',
  purple: '#7c3aed',
  deepOrange: '#f97316',
  darkSurface: '#1a1a2e',
  textLight: '#9ca3af',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 100,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};
