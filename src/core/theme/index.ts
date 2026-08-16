/**
 * Static layout tokens — safe to use anywhere, not theme-dependent.
 * For colour values, always use `useAppTheme()` → `theme.colors.*`
 */

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

/**
 * Obsidian fallback colors — only for use outside of React component contexts
 * (e.g. export services, navigation options). Prefer useAppTheme() in components.
 */
export const colors = {
  background: '#07060E',
  surface: '#110D1F',
  card: '#141026',
  cardBorder: 'rgba(255, 255, 255, 0.07)',
  primary: '#7C3AED',
  primaryLight: '#C084FC',
  primaryDark: '#5B21B6',
  primaryMuted: 'rgba(124, 58, 237, 0.15)',
  income: '#10B981',
  incomeLight: '#34D399',
  incomeMuted: 'rgba(16, 185, 129, 0.15)',
  expense: '#F43F5E',
  expenseLight: '#FB7185',
  expenseMuted: 'rgba(244, 63, 94, 0.15)',
  savings: '#F59E0B',
  savingsMuted: 'rgba(245, 158, 11, 0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',
};
