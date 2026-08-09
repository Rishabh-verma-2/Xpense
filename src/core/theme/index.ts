// Theme tokens for Xpense

export const colors = {
  // Backgrounds
  background: '#0A0A0F',
  surface: '#13131A',
  card: '#1A1A25',
  cardBorder: '#2A2A3A',

  // Accents
  primary: '#7C3AED',
  primaryLight: '#9F67FF',
  primaryDark: '#5B21B6',
  primaryMuted: 'rgba(124, 58, 237, 0.15)',

  // Semantic
  income: '#10B981',
  incomeLight: '#34D399',
  incomeMuted: 'rgba(16, 185, 129, 0.15)',

  expense: '#EF4444',
  expenseLight: '#F87171',
  expenseMuted: 'rgba(239, 68, 68, 0.15)',

  savings: '#F59E0B',
  savingsMuted: 'rgba(245, 158, 11, 0.15)',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  displayLarge: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3 },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8 },
};
