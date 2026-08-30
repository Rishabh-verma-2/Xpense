export type ThemeId =
  | 'obsidian'
  | 'emerald'
  | 'sapphire'
  | 'amber'
  | 'pearl'
  | 'rosegold'
  | 'midnight'
  | 'aurora';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  cardBorderActive: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;
  income: string;
  incomeLight: string;
  incomeMuted: string;
  expense: string;
  expenseLight: string;
  expenseMuted: string;
  savings: string;
  savingsMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  mesh1: string;
  mesh2: string;
  navBarBackground: string;
  navBarBorder: string;
}

export type StatusBarStyle = 'light-content' | 'dark-content';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  mode: 'dark' | 'light';
  statusBarStyle: StatusBarStyle;
  accentColor: string;
  accentGradient: [string, string];
  heroGradient: [string, string, string];
  previewColors: [string, string, string];
  colors: ThemeColors;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Violet',
    tagline: 'Deep cosmic onyx with electric violet glows',
    mode: 'dark',
    statusBarStyle: 'light-content',
    accentColor: '#C084FC',
    accentGradient: ['#7C3AED', '#C084FC'],
    heroGradient: ['#241245', '#150A2E', '#0B0618'],
    previewColors: ['#07060E', '#7C3AED', '#C084FC'],
    colors: {
      background: '#07060E',
      surface: '#110D1F',
      card: '#141026',
      cardBorder: 'rgba(255, 255, 255, 0.07)',
      cardBorderActive: 'rgba(192, 132, 252, 0.4)',
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
      mesh1: 'rgba(124, 58, 237, 0.25)',
      mesh2: 'rgba(192, 132, 252, 0.15)',
      navBarBackground: 'rgba(14, 11, 24, 0.92)',
      navBarBorder: 'rgba(255, 255, 255, 0.12)',
    },
  },

  emerald: {
    id: 'emerald',
    name: 'Emerald Onyx',
    tagline: 'Deep charcoal with rich mint & wealth greens',
    mode: 'dark',
    statusBarStyle: 'light-content',
    accentColor: '#34D399',
    accentGradient: ['#059669', '#34D399'],
    heroGradient: ['#063024', '#031D16', '#020F0B'],
    previewColors: ['#040D09', '#059669', '#34D399'],
    colors: {
      background: '#040D09',
      surface: '#081711',
      card: '#0C2018',
      cardBorder: 'rgba(255, 255, 255, 0.07)',
      cardBorderActive: 'rgba(52, 211, 153, 0.4)',
      primary: '#059669',
      primaryLight: '#34D399',
      primaryDark: '#047857',
      primaryMuted: 'rgba(5, 150, 105, 0.15)',
      income: '#10B981',
      incomeLight: '#34D399',
      incomeMuted: 'rgba(16, 185, 129, 0.15)',
      expense: '#F43F5E',
      expenseLight: '#FB7185',
      expenseMuted: 'rgba(244, 63, 94, 0.15)',
      savings: '#F59E0B',
      savingsMuted: 'rgba(245, 158, 11, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#D1FAE5',
      textMuted: '#6EE7B7',
      textOnPrimary: '#FFFFFF',
      mesh1: 'rgba(5, 150, 105, 0.28)',
      mesh2: 'rgba(52, 211, 153, 0.15)',
      navBarBackground: 'rgba(4, 14, 9, 0.92)',
      navBarBorder: 'rgba(52, 211, 153, 0.15)',
    },
  },

  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Cyber',
    tagline: 'Electric cyber cyan over deep navy midnight',
    mode: 'dark',
    statusBarStyle: 'light-content',
    accentColor: '#38BDF8',
    accentGradient: ['#0284C7', '#38BDF8'],
    heroGradient: ['#0A2540', '#061628', '#030B14'],
    previewColors: ['#030914', '#0284C7', '#38BDF8'],
    colors: {
      background: '#030914',
      surface: '#071526',
      card: '#0B1E36',
      cardBorder: 'rgba(255, 255, 255, 0.07)',
      cardBorderActive: 'rgba(56, 189, 248, 0.4)',
      primary: '#0284C7',
      primaryLight: '#38BDF8',
      primaryDark: '#0369A1',
      primaryMuted: 'rgba(2, 132, 199, 0.15)',
      income: '#10B981',
      incomeLight: '#34D399',
      incomeMuted: 'rgba(16, 185, 129, 0.15)',
      expense: '#F43F5E',
      expenseLight: '#FB7185',
      expenseMuted: 'rgba(244, 63, 94, 0.15)',
      savings: '#F59E0B',
      savingsMuted: 'rgba(245, 158, 11, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E0F2FE',
      textMuted: '#7DD3FC',
      textOnPrimary: '#FFFFFF',
      mesh1: 'rgba(2, 132, 199, 0.28)',
      mesh2: 'rgba(56, 189, 248, 0.15)',
      navBarBackground: 'rgba(3, 9, 20, 0.92)',
      navBarBorder: 'rgba(56, 189, 248, 0.15)',
    },
  },

  amber: {
    id: 'amber',
    name: 'Imperial Amber',
    tagline: 'Warm luxury gold & burnt espresso radiance',
    mode: 'dark',
    statusBarStyle: 'light-content',
    accentColor: '#FBBF24',
    accentGradient: ['#D97706', '#FBBF24'],
    heroGradient: ['#382104', '#211302', '#120A01'],
    previewColors: ['#0D0802', '#D97706', '#FBBF24'],
    colors: {
      background: '#0D0802',
      surface: '#170F04',
      card: '#241707',
      cardBorder: 'rgba(255, 255, 255, 0.07)',
      cardBorderActive: 'rgba(251, 191, 36, 0.4)',
      primary: '#D97706',
      primaryLight: '#FBBF24',
      primaryDark: '#B45309',
      primaryMuted: 'rgba(217, 119, 6, 0.15)',
      income: '#10B981',
      incomeLight: '#34D399',
      incomeMuted: 'rgba(16, 185, 129, 0.15)',
      expense: '#F43F5E',
      expenseLight: '#FB7185',
      expenseMuted: 'rgba(244, 63, 94, 0.15)',
      savings: '#FBBF24',
      savingsMuted: 'rgba(251, 191, 36, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#FEF3C7',
      textMuted: '#FCD34D',
      textOnPrimary: '#FFFFFF',
      mesh1: 'rgba(217, 119, 6, 0.28)',
      mesh2: 'rgba(251, 191, 36, 0.15)',
      navBarBackground: 'rgba(13, 8, 2, 0.92)',
      navBarBorder: 'rgba(251, 191, 36, 0.15)',
    },
  },

  pearl: {
    id: 'pearl',
    name: 'Pearl Crystal',
    tagline: 'Crisp daytime pearl with clean luxury contrast',
    mode: 'light',
    statusBarStyle: 'dark-content',
    accentColor: '#7C3AED',
    accentGradient: ['#7C3AED', '#9333EA'],
    heroGradient: ['#241245', '#150A2E', '#0B0618'],
    previewColors: ['#F8FAFC', '#7C3AED', '#0F172A'],
    colors: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      cardBorder: 'rgba(15, 23, 42, 0.08)',
      cardBorderActive: 'rgba(124, 58, 237, 0.4)',
      primary: '#7C3AED',
      primaryLight: '#8B5CF6',
      primaryDark: '#6D28D9',
      primaryMuted: 'rgba(124, 58, 237, 0.10)',
      income: '#059669',
      incomeLight: '#10B981',
      incomeMuted: 'rgba(5, 150, 105, 0.12)',
      expense: '#E11D48',
      expenseLight: '#F43F5E',
      expenseMuted: 'rgba(225, 29, 72, 0.10)',
      savings: '#D97706',
      savingsMuted: 'rgba(217, 119, 6, 0.10)',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      textOnPrimary: '#FFFFFF',
      mesh1: 'rgba(124, 58, 237, 0.08)',
      mesh2: 'rgba(147, 51, 234, 0.05)',
      navBarBackground: 'rgba(255, 255, 255, 0.95)',
      navBarBorder: 'rgba(15, 23, 42, 0.08)',
    },
  },

  rosegold: {
    id: 'rosegold',
    name: 'Rose Gold Luxury',
    tagline: 'Warm champagne blush with gilded rose accents',
    mode: 'dark',
    statusBarStyle: 'light-content',
    accentColor: '#F9A8D4',
    accentGradient: ['#DB2777', '#F9A8D4'],
    heroGradient: ['#3D0A1E', '#230511', '#120209'],
    previewColors: ['#0E0307', '#DB2777', '#F9A8D4'],
    colors: {
      background: '#0E0307',
      surface: '#1A0610',
      card: '#250B18',
      cardBorder: 'rgba(255, 255, 255, 0.07)',
      cardBorderActive: 'rgba(249, 168, 212, 0.45)',
      primary: '#DB2777',
      primaryLight: '#F9A8D4',
      primaryDark: '#9D174D',
      primaryMuted: 'rgba(219, 39, 119, 0.15)',
      income: '#10B981',
      incomeLight: '#34D399',
      incomeMuted: 'rgba(16, 185, 129, 0.15)',
      expense: '#F43F5E',
      expenseLight: '#FB7185',
      expenseMuted: 'rgba(244, 63, 94, 0.15)',
      savings: '#FBBF24',
      savingsMuted: 'rgba(251, 191, 36, 0.15)',
      textPrimary: '#FFF1F5',
      textSecondary: '#FBCFE8',
      textMuted: '#F472B6',
      textOnPrimary: '#FFFFFF',
      mesh1: 'rgba(219, 39, 119, 0.28)',
      mesh2: 'rgba(249, 168, 212, 0.14)',
      navBarBackground: 'rgba(14, 3, 7, 0.92)',
      navBarBorder: 'rgba(249, 168, 212, 0.15)',
    },
  },

  midnight: {
    id: 'midnight',
    name: 'Midnight Noir',
    tagline: 'True OLED black with electric neon cyan strikes',
    mode: 'dark',
    statusBarStyle: 'light-content',
    accentColor: '#22D3EE',
    accentGradient: ['#0891B2', '#22D3EE'],
    heroGradient: ['#071A20', '#040F14', '#010608'],
    previewColors: ['#000000', '#0891B2', '#22D3EE'],
    colors: {
      background: '#000000',
      surface: '#080F12',
      card: '#0D1A20',
      cardBorder: 'rgba(255, 255, 255, 0.06)',
      cardBorderActive: 'rgba(34, 211, 238, 0.45)',
      primary: '#0891B2',
      primaryLight: '#22D3EE',
      primaryDark: '#0E7490',
      primaryMuted: 'rgba(8, 145, 178, 0.15)',
      income: '#10B981',
      incomeLight: '#34D399',
      incomeMuted: 'rgba(16, 185, 129, 0.15)',
      expense: '#F43F5E',
      expenseLight: '#FB7185',
      expenseMuted: 'rgba(244, 63, 94, 0.15)',
      savings: '#A78BFA',
      savingsMuted: 'rgba(167, 139, 250, 0.15)',
      textPrimary: '#F0FDFF',
      textSecondary: '#CFFAFE',
      textMuted: '#67E8F9',
      textOnPrimary: '#000000',
      mesh1: 'rgba(8, 145, 178, 0.25)',
      mesh2: 'rgba(34, 211, 238, 0.10)',
      navBarBackground: 'rgba(0, 0, 0, 0.95)',
      navBarBorder: 'rgba(34, 211, 238, 0.12)',
    },
  },

  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    tagline: 'Cosmic teal-violet gradient with galactic depth',
    mode: 'dark',
    statusBarStyle: 'light-content',
    accentColor: '#6EE7B7',
    accentGradient: ['#065F46', '#6EE7B7'],
    heroGradient: ['#0D2B3E', '#071C2A', '#030D15'],
    previewColors: ['#030C18', '#065F46', '#6EE7B7'],
    colors: {
      background: '#030C18',
      surface: '#071624',
      card: '#0C2035',
      cardBorder: 'rgba(110, 231, 183, 0.10)',
      cardBorderActive: 'rgba(110, 231, 183, 0.5)',
      primary: '#059669',
      primaryLight: '#6EE7B7',
      primaryDark: '#047857',
      primaryMuted: 'rgba(5, 150, 105, 0.15)',
      income: '#6EE7B7',
      incomeLight: '#A7F3D0',
      incomeMuted: 'rgba(110, 231, 183, 0.15)',
      expense: '#F87171',
      expenseLight: '#FCA5A5',
      expenseMuted: 'rgba(248, 113, 113, 0.15)',
      savings: '#34D399',
      savingsMuted: 'rgba(52, 211, 153, 0.15)',
      textPrimary: '#ECFDF5',
      textSecondary: '#A7F3D0',
      textMuted: '#6EE7B7',
      textOnPrimary: '#000000',
      mesh1: 'rgba(5, 150, 105, 0.22)',
      mesh2: 'rgba(110, 231, 183, 0.10)',
      navBarBackground: 'rgba(3, 12, 24, 0.93)',
      navBarBorder: 'rgba(110, 231, 183, 0.15)',
    },
  },
};

export const DEFAULT_THEME_ID: ThemeId = 'obsidian';
