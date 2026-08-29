import { AppNotification, NotificationPreferences } from '../../shared/types/notification.types';
import { STORAGE_KEYS } from '../../shared/constants/appConstants';
import { storageGet, storageSet } from '../asyncStorageClient';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  budgetAlerts: true,
  dailyReminder: true,
  dailyReminderTime: '20:00', // 8:00 PM
  weeklyDigest: true,
};

const MAX_NOTIFICATIONS = 50;

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const stored = await storageGet<Partial<NotificationPreferences>>(STORAGE_KEYS.NOTIFICATION_PREFS);
  return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) };
}

export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences();
  const updated = { ...current, ...prefs };
  await storageSet(STORAGE_KEYS.NOTIFICATION_PREFS, updated);
  return updated;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const list = await storageGet<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS);
  return list ?? [];
}

export async function addNotification(
  notification: Omit<AppNotification, 'id' | 'date' | 'read'> & { id?: string; date?: string; read?: boolean }
): Promise<AppNotification> {
  const current = await getNotifications();
  const newNotif: AppNotification = {
    id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    date: notification.date || new Date().toISOString(),
    read: notification.read ?? false,
    data: notification.data,
  };

  // Keep latest 50 notifications
  const updated = [newNotif, ...current].slice(0, MAX_NOTIFICATIONS);
  await storageSet(STORAGE_KEYS.NOTIFICATIONS, updated);
  return newNotif;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const current = await getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  await storageSet(STORAGE_KEYS.NOTIFICATIONS, updated);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const current = await getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  await storageSet(STORAGE_KEYS.NOTIFICATIONS, updated);
}

export async function clearAllNotifications(): Promise<void> {
  await storageSet(STORAGE_KEYS.NOTIFICATIONS, []);
}
