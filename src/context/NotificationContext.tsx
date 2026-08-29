import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppNotification, NotificationPreferences } from '../shared/types/notification.types';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  getNotifications,
  markNotificationAsRead as repoMarkAsRead,
  markAllNotificationsAsRead as repoMarkAllAsRead,
  clearAllNotifications as repoClearAll,
} from '../storage/repositories/NotificationRepository';
import {
  requestNotificationPermission,
  checkNotificationPermission,
  sendLocalNotification,
  scheduleDailyReminder,
  cancelDailyReminder,
  checkBudgetThresholdAlert,
} from '../services/notificationService';
import { useAuth } from './AuthContext';
import { notificationsApi } from '../services/api';
import { storageGet, storageSet } from '../storage/asyncStorageClient';

const ANNOUNCEMENT_KEY = '@xpense/announcement_v1_delivered';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  updatePreferences: (changes: Partial<NotificationPreferences>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  checkBudgetAlerts: (params: {
    categoryName: string;
    categoryId: string;
    currentSpend: number;
    previousSpend: number;
    budgetLimit: number;
    currencySymbol?: string;
  }) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    budgetAlerts: true,
    dailyReminder: true,
    dailyReminderTime: '20:00', // 8:00 PM default
    weeklyDigest: true,
  });
  const [hasPermission, setHasPermission] = useState(false);

  const refreshNotifications = useCallback(async () => {
    try {
      const list = await getNotifications();
      setNotifications(list);
    } catch (e) {
      console.warn('[NotificationContext] refreshNotifications error:', e);
    }
  }, []);

  const { token } = useAuth();

  // Initialize preferences, permissions, and notifications + push feature announcement
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedPrefs, storedNotifs, perm, announcementDelivered] = await Promise.all([
          getNotificationPreferences(),
          getNotifications(),
          checkNotificationPermission(),
          storageGet<boolean>(ANNOUNCEMENT_KEY),
        ]);

        let initialNotifs = storedNotifs;

        // Auto-push the new feature announcement to all logged in users on this device
        const ANNOUNCEMENT_TITLE = '🚀 New: Smart Budget Warnings & 8:00 PM Reminders!';
        const hasAnnouncement = initialNotifs.some((n) => n.title === ANNOUNCEMENT_TITLE);

        if (!hasAnnouncement) {
          try {
            await sendLocalNotification({
              type: 'system',
              title: ANNOUNCEMENT_TITLE,
              body: 'Automated 80% & 100% budget limit alerts and an 8:00 PM daily expense reminder are now active! Tap to configure.',
              data: { screen: 'NotificationSettings' },
            });
            initialNotifs = await getNotifications();
          } catch (err) {
            console.warn('[NotificationContext] announcement dispatch warning:', err);
          }
        }

        // If authenticated, sync with remote broadcast notifications from MongoDB Atlas
        if (token) {
          try {
            const res = await notificationsApi.list();
            if (res?.success && Array.isArray(res.data)) {
              for (const remote of res.data) {
                const alreadyExists = initialNotifs.some(
                  (n) => n.id === remote.id || (n.title === remote.title && n.body === remote.body)
                );
                if (!alreadyExists) {
                  await sendLocalNotification({
                    type: remote.type || 'system',
                    title: remote.title,
                    body: remote.body,
                    data: remote.data || {},
                  });
                }
              }
              initialNotifs = await getNotifications();
            }
          } catch (err) {
            console.warn('[NotificationContext] Remote broadcast sync warning:', err);
          }
        }

        if (mounted) {
          setPreferences(storedPrefs);
          setNotifications(initialNotifs);
          setHasPermission(perm);

          // If daily reminder enabled and has permission, ensure schedule is registered (8:00 PM)
          if (storedPrefs.enabled && storedPrefs.dailyReminder && perm) {
            const [h, m] = (storedPrefs.dailyReminderTime || '20:00').split(':').map(Number);
            await scheduleDailyReminder(h || 20, m || 0);
          }
        }
      } catch (e) {
        console.warn('[NotificationContext] init error:', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    return granted;
  }, []);

  const updatePreferences = useCallback(
    async (changes: Partial<NotificationPreferences>) => {
      const updated = await saveNotificationPreferences(changes);
      setPreferences(updated);

      // Handle daily reminder scheduling changes
      if (updated.enabled && updated.dailyReminder) {
        const [h, m] = (updated.dailyReminderTime || '20:00').split(':').map(Number);
        await scheduleDailyReminder(h || 20, m || 0);
      } else {
        await cancelDailyReminder();
      }
    },
    []
  );

  const markAsRead = useCallback(async (id: string) => {
    await repoMarkAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await repoMarkAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(async () => {
    await repoClearAll();
    setNotifications([]);
  }, []);

  const sendTestNotification = useCallback(async () => {
    await sendLocalNotification({
      type: 'system',
      title: '🔔 Xpense Notifications Active',
      body: 'Notifications are working! You will receive smart budget warnings and 8:00 PM reminders.',
    });
    await refreshNotifications();
  }, [refreshNotifications]);

  const checkBudgetAlerts = useCallback(
    async (params: {
      categoryName: string;
      categoryId: string;
      currentSpend: number;
      previousSpend: number;
      budgetLimit: number;
      currencySymbol?: string;
    }) => {
      if (!preferences.enabled || !preferences.budgetAlerts) return;
      await checkBudgetThresholdAlert(params);
      await refreshNotifications();
    },
    [preferences.enabled, preferences.budgetAlerts, refreshNotifications]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        hasPermission,
        requestPermission,
        updatePreferences,
        markAsRead,
        markAllAsRead,
        clearAll,
        sendTestNotification,
        checkBudgetAlerts,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
