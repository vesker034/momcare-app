export const colors = {
  background: '#FAF7F3',
  backgroundWarm: '#FFF8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F2EFEA',
  surfaceSoft: '#F8F2EE',
  surfaceRose: '#FFF0F3',
  primary: '#A34D5D',
  primaryDark: '#8F3F50',
  primaryPressed: '#8F3F50',
  primarySoft: '#F28FA0',
  secondary: '#B996F5',
  accent: '#FFD2B8',
  accentSoft: '#FFE7D7',
  pink: '#F28FA0',
  pinkSoft: '#FFD6DC',
  peach: '#FFD2B8',
  peachSoft: '#FFF1E8',
  lavender: '#B996F5',
  lavenderSoft: '#EFE4FF',
  blueSoft: '#E8F2FF',
  text: '#252220',
  textPrimary: '#252220',
  textSecondary: '#6F615C',
  textMuted: '#958985',
  border: '#E9DED8',
  borderSoft: '#F2E9E4',
  danger: '#D92D20',
  success: '#4F9A77',
  warning: '#C7823A',
  tabInactive: '#5C504D',
  overlay: 'rgba(37, 34, 32, 0.42)',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 40,
  pill: 999,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: '#A34D5D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  medium: {
    shadowColor: '#A34D5D',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 5,
  },
  button: {
    shadowColor: '#8F3F50',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 4,
  },
} as const;

export const typography = {
  hero: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
} as const;

export type Theme = typeof theme;
