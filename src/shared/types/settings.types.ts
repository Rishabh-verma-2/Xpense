export interface Settings {
  currencyCode: string; // ISO 4217 e.g. INR, USD
  currencySymbol: string;
  themeMode: 'light' | 'dark' | 'system';
  language: string; // locale code, default 'en'
  appLockEnabled: boolean;
  appLockMethod: 'pin' | 'biometric' | 'both' | null;
  appLockTimeoutMinutes: number; // 0 = immediate
  budgetNotificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string | null; // HH:mm
  quietHoursStart: string; // default 22:00
  quietHoursEnd: string; // default 07:00
  allowFutureDatedEntries: boolean;
  onboardingCompleted: boolean;
  schemaVersion: number;
  defaultTransactionType: 'expense' | 'income';
  lastUsedPaymentMethod: string;
  historyDefaultSort: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

export interface DailyTrendItem {
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface Statistics {
  period: string; // YYYY-MM or YYYY
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number | null;
  categoryBreakdown: CategoryBreakdownItem[];
  dailyTrend: DailyTrendItem[];
  comparisonToPreviousPeriod: {
    incomeChangePercent: number | null;
    expenseChangePercent: number | null;
  };
}
