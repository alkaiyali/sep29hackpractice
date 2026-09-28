/**
 * Meddy Color Tokens
 * Light: clean clinical paper with deep-pine hero panels.
 * Dark: true AMOLED — pure-black canvas, near-black surfaces, neon teal accents.
 * Every screen consumes these via ThemeProvider; no hardcoded hexes in UI.
 */

export const Colors = {
  light: {
    primary: '#0D9488', // Deep Teal
    primaryDark: '#0F766E',
    primaryLight: '#CCFBF1',
    primarySoft: '#E3F8F3',

    accent: '#0284C7', // Sky Blue
    accentLight: '#E0F2FE',

    success: '#059669', // Emerald
    successLight: '#D1FAE5',

    warning: '#B45309', // Warm Amber (darkened for AA on light fills)
    warningLight: '#FEF3C7',

    danger: '#E11D48', // Clinical Rose
    dangerLight: '#FFE4E6',

    background: '#F2F5F7',
    surface: '#FFFFFF',
    surfaceSubtle: '#EAF0F4',
    surfaceBorder: '#DDE6EC',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#8AA0B4',
    textInverse: '#FFFFFF',

    cardShadow: 'rgba(15, 42, 38, 0.10)',
    tabBarActive: '#0D9488',
    tabBarInactive: '#8AA0B4',

    // Text/icons drawn on top of a primary fill
    onPrimary: '#FFFFFF',
    // Unfilled progress / track surfaces
    track: '#E2EAEF',
    // Glow for primary CTAs
    glow: 'rgba(13, 148, 136, 0.35)',

    // Hero panel (adherence card)
    hero: '#0B2F2B',
    heroBorder: '#0B2F2B',
    heroText: '#FFFFFF',
    heroSub: '#A7D8D0',
    heroTrack: 'rgba(255, 255, 255, 0.16)',
    heroFill: '#5EEAD4',
  },
  dark: {
    primary: '#2DD4BF', // Neon Teal — signature AMOLED accent
    primaryDark: '#5EEAD4',
    primaryLight: '#0B2E2B',
    primarySoft: '#0A1F1D',

    accent: '#38BDF8',
    accentLight: '#0B2536',

    success: '#34D399',
    successLight: '#0A2A21',

    warning: '#FBBF24',
    warningLight: '#2A1F08',

    danger: '#FB7185',
    dangerLight: '#2A0E14',

    background: '#000000', // Pure black — pixels off
    surface: '#0C0C0E',
    surfaceSubtle: '#151518',
    surfaceBorder: '#242429',

    textPrimary: '#F4F4F5',
    textSecondary: '#A7A7B0',
    textMuted: '#5E5E68',
    textInverse: '#000000',

    cardShadow: 'rgba(0, 0, 0, 0)',
    tabBarActive: '#2DD4BF',
    tabBarInactive: '#52525B',

    // Text/icons drawn on top of a primary fill
    onPrimary: '#03211D',
    // Unfilled progress / track surfaces
    track: '#1E1E24',
    // Glow for primary CTAs
    glow: 'rgba(45, 212, 191, 0.35)',

    // Hero panel (adherence card)
    hero: '#061412',
    heroBorder: '#16423C',
    heroText: '#ECFDF5',
    heroSub: '#6FD7C3',
    heroTrack: 'rgba(45, 212, 191, 0.18)',
    heroFill: '#2DD4BF',
  },
};

export type ThemeColors = typeof Colors.light;
