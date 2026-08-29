export type NotificationType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'daily_reminder'
  | 'weekly_digest'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: string; // ISO timestamp
  read: boolean;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  enabled: boolean;
  budgetAlerts: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // '20:00' (8:00 PM default)
  weeklyDigest: boolean;
}
