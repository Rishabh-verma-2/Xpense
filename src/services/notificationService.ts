import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AppNotification, NotificationType } from '../shared/types/notification.types';
import { addNotification } from '../storage/repositories/NotificationRepository';

// Configure foreground notification presentation
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ─── Channels for Android ───────────────────────────────────────────────────
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });
      await Notifications.setNotificationChannelAsync('budget-alerts', {
        name: 'Budget Warnings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
      });
      await Notifications.setNotificationChannelAsync('daily-reminders', {
        name: 'Daily Expense Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#7C3AED',
      });
    } catch (e) {
      console.warn('[Notifications] setupNotificationChannels warning:', e);
    }
  }
}

// ─── Permission Handling ────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') return true;

        // Support both modern Promise-based and legacy callback-based requestPermission
        const result = await new Promise<string>((resolve) => {
          try {
            const p = Notification.requestPermission((res) => {
              if (res) resolve(res);
            });
            if (p && typeof p.then === 'function') {
              p.then(resolve).catch(() => resolve(Notification.permission));
            }
          } catch {
            resolve(Notification.permission);
          }
        });
        return result === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  }

  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      await setupNotificationChannels();
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    const granted =
      requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (granted) {
      await setupNotificationChannels();
    }
    return !!granted;
  } catch (e) {
    console.warn('[Notifications] requestNotificationPermission error:', e);
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  try {
    const settings = await Notifications.getPermissionsAsync();
    return !!(settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
  } catch {
    return false;
  }
}

// ─── Send Immediate Notification ────────────────────────────────────────────
export async function sendLocalNotification(params: {
  type: NotificationType;
  title: string;
  body: string;
  channelId?: string;
  data?: Record<string, any>;
}): Promise<AppNotification> {
  const { type, title, body, channelId = 'default', data = {} } = params;

  // 1. Record in persistent in-app notification repository
  let savedNotif: AppNotification;
  try {
    savedNotif = await addNotification({
      type,
      title,
      body,
      data,
    });
  } catch {
    savedNotif = {
      id: `notif_${Date.now()}`,
      type,
      title,
      body,
      date: new Date().toISOString(),
      read: false,
      data,
    };
  }

  // 2. Dispatch system OS notification banner
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        let shown = false;

        // Mobile Chrome/Android & iOS PWA require ServiceWorkerRegistration.showNotification
        // Calling new Notification() throws "Illegal constructor" on mobile devices
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && typeof reg.showNotification === 'function') {
              await reg.showNotification(title, {
                body,
                icon: '/assets/icon-192.png',
                badge: '/assets/icon-192.png',
                data,
              });
              shown = true;
            }
          } catch (swErr) {
            console.warn('[Notifications SW] showNotification fallback:', swErr);
          }
        }

        // Desktop browser fallback
        if (!shown) {
          try {
            new Notification(title, {
              body,
              icon: '/assets/icon-192.png',
              badge: '/assets/icon-192.png',
              data,
            });
          } catch (err) {
            console.warn('[Notifications] Desktop new Notification fallback failed:', err);
          }
        }
      } catch (e) {
        console.warn('[Notifications Web] dispatch error:', e);
      }
    }
  } else {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, notificationId: savedNotif.id, type },
          sound: true,
          badge: 1,
        },
        trigger: null, // deliver immediately
      });
    } catch (e) {
      console.warn('[Notifications Native] dispatch error:', e);
    }
  }

  return savedNotif;
}

// ─── Schedule Repeating Daily Reminder (8:00 PM) ────────────────────────────
const DAILY_REMINDER_IDENTIFIER = 'xpense_daily_evening_reminder';

export async function scheduleDailyReminder(hour: number = 20, minute: number = 0): Promise<void> {
  if (Platform.OS === 'web') {
    // Scheduled local background alarms are an OS-level feature on native iOS & Android
    return;
  }

  try {
    // Cancel any existing daily reminder first
    await cancelDailyReminder();

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_IDENTIFIER,
      content: {
        title: '🌙 Evening Expense Ping',
        body: 'Did you spend anything today? Take 30 seconds to log your cash & UPI spends.',
        data: { screen: 'AddTransaction' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: 'daily-reminders',
        hour,
        minute,
      },
    });
    console.log(`[Notifications] Scheduled daily evening reminder for ${hour}:${String(minute).padStart(2, '0')}`);
  } catch (e) {
    console.warn('[Notifications] scheduleDailyReminder error:', e);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_IDENTIFIER);
  } catch (e) {
    console.warn('[Notifications] cancelDailyReminder error:', e);
  }
}

// ─── Budget Alert Evaluator ─────────────────────────────────────────────────
// Set to track which categories were already alerted in the current session
const alertedCategoriesInSession = new Set<string>();

export async function checkBudgetThresholdAlert(params: {
  categoryName: string;
  categoryId: string;
  currentSpend: number;
  previousSpend: number;
  budgetLimit: number;
  currencySymbol?: string;
}): Promise<void> {
  const {
    categoryName,
    categoryId,
    currentSpend,
    previousSpend,
    budgetLimit,
    currencySymbol = '₹',
  } = params;

  if (!budgetLimit || budgetLimit <= 0) return;

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const key100 = `${currentMonthKey}_${categoryId}_100`;
  const key80 = `${currentMonthKey}_${categoryId}_80`;

  // Check 100% Threshold (Critical)
  if (currentSpend >= budgetLimit && previousSpend < budgetLimit && !alertedCategoriesInSession.has(key100)) {
    alertedCategoriesInSession.add(key100);
    await sendLocalNotification({
      type: 'budget_exceeded',
      title: `🚨 ${categoryName} Budget Exceeded!`,
      body: `You've spent ${currencySymbol}${Math.round(currentSpend).toLocaleString()} out of your ${currencySymbol}${Math.round(budgetLimit).toLocaleString()} limit for this month.`,
      channelId: 'budget-alerts',
      data: { categoryId, categoryName, budgetLimit, currentSpend },
    });
    return;
  }

  // Check 80% Threshold (Warning)
  const threshold80 = budgetLimit * 0.8;
  if (
    currentSpend >= threshold80 &&
    previousSpend < threshold80 &&
    currentSpend < budgetLimit &&
    !alertedCategoriesInSession.has(key80)
  ) {
    alertedCategoriesInSession.add(key80);
    await sendLocalNotification({
      type: 'budget_warning',
      title: `⚠️ ${categoryName} Budget Warning (80%)`,
      body: `Heads up! You've used 80% of your ${categoryName} monthly budget (${currencySymbol}${Math.round(currentSpend).toLocaleString()} of ${currencySymbol}${Math.round(budgetLimit).toLocaleString()}).`,
      channelId: 'budget-alerts',
      data: { categoryId, categoryName, budgetLimit, currentSpend },
    });
  }
}
