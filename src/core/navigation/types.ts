export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  AddTransaction: { type?: 'expense' | 'income' };
};

export type MainTabParamList = {
  DashboardTab: undefined;
  HistoryTab: undefined;
  ReportsTab: undefined;
  BudgetsTab: undefined;
  SettingsTab: undefined;
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  TransactionDetail: { transactionId: string };
  EditTransaction: { transactionId: string };
};

export type ReportsStackParamList = {
  MonthlyReport: { monthKey?: string };
  YearlyReport: { year?: string };
  CategoryDrilldown: { categoryId: string; monthKey: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  CategoryManagement: undefined;
  AddEditCategory: { categoryId?: string };
  CurrencySettings: undefined;
  NotificationSettings: undefined;
  About: undefined;
  Export: undefined;
};

