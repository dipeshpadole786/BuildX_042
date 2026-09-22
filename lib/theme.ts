/**
 * Pulse design tokens.
 * Shared language from the inspiration set: ice-blue field, white rounded
 * surfaces, coral for the one primary action, blue for live status,
 * yellow for waiting, and a black circle for the active tab.
 */
export const colors = {
  bg: '#EAF3FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#16181D',
  textSecondary: '#5C6B7A',
  textMuted: '#8B97A6',
  muted: '#5C6B7A',
  border: '#E3EEF6',
  borderStrong: '#D3E2EE',
  white: '#FFFFFF',
  ink: '#111111',

  primary: '#FF5A67',
  primaryPressed: '#E84656',
  primarySoft: '#FFE8EB',

  accent: '#2F80ED',
  accentSoft: '#D7F0FF',

  warning: '#F5C518',
  warningSoft: '#FFF4C8',

  success: '#1F9D62',
  successSoft: '#E5F7EE',

  danger: '#FF5A67',
  dangerSoft: '#FFE8EB',

  slate400: '#8B97A6',
  slate500: '#5C6B7A',
  slate600: '#465463',
  slate700: '#334155',
  slate800: '#1F2933',
  slate900: '#16181D',

  red50: '#FFF1F3',
  red100: '#FFE4E8',
  red200: '#FECDD3',
  red500: '#FF5A67',
  red600: '#FF5A67',
  red700: '#E11D48',
  red800: '#BE123C',

  amber50: '#FFF8DC',
  amber100: '#FFF4C8',
  amber200: '#FDE68A',
  amber300: '#F5C518',
  amber500: '#F5C518',
  amber600: '#C8960A',
  amber700: '#A16207',
  amber800: '#854D0E',

  blue50: '#EAF6FF',
  blue100: '#D7F0FF',
  blue200: '#B9E2FF',
  blue600: '#2F80ED',
  blue700: '#1D6FE0',
  blue800: '#1E4E9C',

  emerald50: '#E5F7EE',
  emerald100: '#D4F3E4',
  emerald200: '#B4E8CE',
  emerald500: '#1F9D62',
  emerald600: '#1B8A56',
  emerald700: '#166E45',
  emerald800: '#14573A',

  purple600: '#111111',
  cyan600: '#2F80ED',
  cyan200: '#D7F0FF',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#1B3A4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  raised: {
    shadowColor: '#1B3A4B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
};
