/**
 * Meddy Color Tokens
 * Medical-grade, accessible (WCAG AA), high-contrast palette.
 * Strictly adheres to clean teal, emerald, and slate conventions.
 */

export const Colors = {
  light: {
    primary: '#0D9488', // Deep Teal
    primaryDark: '#0F766E',
    primaryLight: '#CCFBF1',
    primarySoft: '#F0FDFA',
    
    accent: '#0284C7', // Sky Blue
    accentLight: '#E0F2FE',

    success: '#059669', // Emerald
    successLight: '#D1FAE5',

    warning: '#D97706', // Warm Amber
    warningLight: '#FEF3C7',

    danger: '#E11D48', // Clinical Rose
    dangerLight: '#FFE4E6',

    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    surfaceBorder: '#E2E8F0',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    cardShadow: 'rgba(15, 23, 42, 0.06)',
    tabBarActive: '#0D9488',
    tabBarInactive: '#94A3B8',
  },
  dark: {
    primary: '#14B8A6',
    primaryDark: '#0D9488',
    primaryLight: '#134E4A',
    primarySoft: '#042F2E',

    accent: '#38BDF8',
    accentLight: '#082F49',

    success: '#10B981',
    successLight: '#064E3B',

    warning: '#F59E0B',
    warningLight: '#78350F',

    danger: '#F43F5E',
    dangerLight: '#881337',

    background: '#0B1120',
    surface: '#111827',
    surfaceSubtle: '#1F2937',
    surfaceBorder: '#374151',

    textPrimary: '#F9FAFB',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    textInverse: '#0B1120',

    cardShadow: 'rgba(0, 0, 0, 0.3)',
    tabBarActive: '#14B8A6',
    tabBarInactive: '#64748B',
  }
};

export type ThemeColors = typeof Colors.light;
