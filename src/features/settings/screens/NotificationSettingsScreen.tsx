import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { useToast } from '../../../context/ToastContext';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { useAppTheme } from '../../../context/ThemeContext';
import { useNotifications } from '../../../context/NotificationContext';
import { hapticMedium, hapticSuccess } from '../../../shared/utils/haptics';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'NotificationSettings'>;
};

const REMINDER_TIME_PRESETS = [
  { label: '7:00 PM', value: '19:00' },
  { label: '8:00 PM (Default)', value: '20:00' },
  { label: '9:00 PM', value: '21:00' },
  { label: '10:00 PM', value: '22:00' },
];

export default function NotificationSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showSuccess, showInfo, showError } = useToast();
  const { theme } = useAppTheme();
  const tc = theme.colors;

  const {
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
    refreshNotifications,
  } = useNotifications();

  React.useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const [testing, setTesting] = useState(false);

  // Master Toggle Handler
  const handleToggleMaster = async (enabled: boolean) => {
    hapticMedium();
    if (enabled && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        showError(
          'Permission Needed',
          'Please enable notification permissions in your device settings to receive alerts.'
        );
        return;
      }
    }
    await updatePreferences({ enabled });
    if (enabled) {
      showSuccess('Alerts Enabled 🔔', 'Daily reminders and budget warnings are now active.');
    } else {
      showInfo('Alerts Paused', 'You will not receive any notifications while disabled.');
    }
  };

  // Toggle specific alert types
  const handleToggleBudget = async (val: boolean) => {
    hapticMedium();
    await updatePreferences({ budgetAlerts: val });
  };

  const handleToggleDailyReminder = async (val: boolean) => {
    hapticMedium();
    await updatePreferences({ dailyReminder: val });
    if (val) {
      showSuccess('Daily Reminder Set', `We will ping you at 8:00 PM to record your expenses.`);
    }
  };

  const handleSelectReminderTime = async (time: string) => {
    hapticMedium();
    await updatePreferences({ dailyReminderTime: time });
    showSuccess('Time Updated', `Daily reminder time changed to ${time === '20:00' ? '8:00 PM' : time}.`);
  };

  const handleToggleWeeklyDigest = async (val: boolean) => {
    hapticMedium();
    await updatePreferences({ weeklyDigest: val });
  };

  // Test Notification Dispatch
  const handleSendTest = async () => {
    if (testing) return;
    setTesting(true);
    hapticSuccess();
    try {
      if (!hasPermission) {
        await requestPermission();
      }
      await sendTestNotification();
      showSuccess(
        'Test Alert Sent 🚀',
        Platform.OS === 'web'
          ? 'Check your browser notification banner!'
          : 'Check your device notification tray!'
      );
    } catch (e: any) {
      showError('Test Failed', e?.message || 'Could not send test notification.');
    } finally {
      setTimeout(() => setTesting(false), 1200);
    }
  };

  const formatNotifTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'budget_exceeded':
        return { icon: 'warning', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)' };
      case 'budget_warning':
        return { icon: 'alert-circle', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'daily_reminder':
        return { icon: 'alarm', color: '#C084FC', bg: 'rgba(192, 132, 252, 0.15)' };
      case 'weekly_digest':
        return { icon: 'stats-chart', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      default:
        return { icon: 'notifications', color: theme.accentColor, bg: `${theme.accentColor}22` };
    }
  };

  const handleBack = () => {
    hapticMedium();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('DashboardTab' as any);
      } else {
        (navigation as any).navigate('DashboardTab');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Notifications & Alerts" onBack={handleBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Master Hero Status Card ── */}
        <View style={[styles.heroCard, { borderColor: theme.colors.cardBorderActive }]}>
          <LinearGradient
            colors={theme.heroGradient}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.specularLine} />

            <View style={styles.heroHeader}>
              <View style={styles.bellIconContainer}>
                <LinearGradient colors={theme.accentGradient} style={styles.bellIconGradient}>
                  <Ionicons name="notifications" size={24} color="#FFFFFF" />
                </LinearGradient>
                {preferences.enabled && <View style={styles.pulseDot} />}
              </View>

              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: preferences.enabled
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.12)',
                    borderColor: preferences.enabled
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'rgba(255, 255, 255, 0.18)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: preferences.enabled ? '#34D399' : '#94A3B8' },
                  ]}
                >
                  {preferences.enabled ? 'ACTIVE & MONITORED' : 'PAUSED'}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Proactive Alert Center</Text>
            <Text style={styles.heroDescription}>
              Smart local alarms and threshold monitors that run 100% offline without third-party tracking.
            </Text>

            {/* Master On/Off Switch Row */}
            <View style={[styles.masterRow, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <View style={styles.masterTextCol}>
                <Text style={styles.masterTitle}>Enable All Notifications</Text>
                <Text style={styles.masterSub}>
                  {preferences.enabled ? 'System notifications are allowed' : 'Toggle on to receive pings'}
                </Text>
              </View>
              <Switch
                value={preferences.enabled}
                onValueChange={handleToggleMaster}
                trackColor={{ false: '#1A162B', true: `${theme.accentColor}66` }}
                thumbColor={preferences.enabled ? theme.accentColor : '#64748B'}
              />
            </View>

            {/* Instant Test Alert Button */}
            <TouchableOpacity
              style={[styles.testBtn, { opacity: testing ? 0.6 : 1 }]}
              onPress={handleSendTest}
              activeOpacity={0.8}
              disabled={testing}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
              <Text style={styles.testBtnText}>
                {testing ? 'Sending...' : 'Send Instant Test Notification'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* ── Active Features Toggles Block ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: tc.textMuted }]}>NOTIFICATION CHANNELS</Text>

          {/* 1. Smart Budget Alerts */}
          <View style={[styles.featureCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="warning-outline" size={22} color="#F59E0B" />
            </View>
            <View style={styles.featureInfo}>
              <View style={styles.featureTitleRow}>
                <Text style={[styles.featureTitle, { color: tc.textPrimary }]}>Smart Budget Alerts</Text>
              </View>
              <Text style={[styles.featureDescription, { color: tc.textSecondary }]}>
                Instant warnings when category spend reaches 80% or 100% of your monthly limit.
              </Text>
            </View>
            <Switch
              value={preferences.enabled && preferences.budgetAlerts}
              onValueChange={handleToggleBudget}
              disabled={!preferences.enabled}
              trackColor={{ false: '#1A162B', true: `${theme.accentColor}66` }}
              thumbColor={preferences.budgetAlerts && preferences.enabled ? theme.accentColor : '#64748B'}
            />
          </View>

          {/* 2. Daily Evening Expense Ping */}
          <View style={[styles.featureCardCol, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.featureCardTopRow}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(192, 132, 252, 0.15)' }]}>
                <Ionicons name="alarm-outline" size={22} color="#C084FC" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureTitle, { color: tc.textPrimary }]}>Daily Evening Reminder</Text>
                <Text style={[styles.featureDescription, { color: tc.textSecondary }]}>
                  Pings you at 8:00 PM to record your cash & UPI expenses before bed.
                </Text>
              </View>
              <Switch
                value={preferences.enabled && preferences.dailyReminder}
                onValueChange={handleToggleDailyReminder}
                disabled={!preferences.enabled}
                trackColor={{ false: '#1A162B', true: `${theme.accentColor}66` }}
                thumbColor={preferences.dailyReminder && preferences.enabled ? theme.accentColor : '#64748B'}
              />
            </View>

            {/* Reminder Time Selector */}
            {preferences.dailyReminder && preferences.enabled && (
              <View style={styles.timeSelectorRow}>
                <Text style={[styles.timeSelectorLabel, { color: tc.textMuted }]}>Reminder Time:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {REMINDER_TIME_PRESETS.map((preset) => {
                    const isSelected = (preferences.dailyReminderTime || '20:00') === preset.value;
                    return (
                      <TouchableOpacity
                        key={preset.value}
                        style={[
                          styles.timePill,
                          {
                            backgroundColor: isSelected ? theme.accentColor : tc.surface,
                            borderColor: isSelected ? theme.accentColor : tc.cardBorder,
                          },
                        ]}
                        onPress={() => handleSelectReminderTime(preset.value)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.timePillText,
                            { color: isSelected ? '#FFFFFF' : tc.textSecondary },
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 3. Weekly Financial Digest */}
          <View style={[styles.featureCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="stats-chart-outline" size={22} color="#10B981" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: tc.textPrimary }]}>Weekly Digest</Text>
              <Text style={[styles.featureDescription, { color: tc.textSecondary }]}>
                Summarizes your outflow and savings rate every Sunday morning.
              </Text>
            </View>
            <Switch
              value={preferences.enabled && preferences.weeklyDigest}
              onValueChange={handleToggleWeeklyDigest}
              disabled={!preferences.enabled}
              trackColor={{ false: '#1A162B', true: `${theme.accentColor}66` }}
              thumbColor={preferences.weeklyDigest && preferences.enabled ? theme.accentColor : '#64748B'}
            />
          </View>
        </View>

        {/* ── In-App Notification Center History ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.notifHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sectionHeaderTitle, { color: tc.textMuted }]}>NOTIFICATION HISTORY</Text>
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.accentColor }]}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                </View>
              )}
            </View>

            {notifications.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={[styles.notifActionText, { color: theme.accentColor }]}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={clearAll}>
                  <Text style={[styles.notifActionText, { color: tc.textMuted }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {notifications.length > 0 ? (
            <View style={styles.notifList}>
              {notifications.map((n) => {
                const iconInfo = getNotifIcon(n.type);
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[
                      styles.notifCard,
                      {
                        backgroundColor: tc.card,
                        borderColor: n.read ? tc.cardBorder : theme.accentColor,
                        borderWidth: n.read ? 1 : 1.2,
                      },
                    ]}
                    onPress={() => markAsRead(n.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.notifIconBox, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.icon as any} size={20} color={iconInfo.color} />
                    </View>

                    <View style={styles.notifContentCol}>
                      <View style={styles.notifTitleRow}>
                        <Text style={[styles.notifTitle, { color: tc.textPrimary }]} numberOfLines={1}>
                          {n.title}
                        </Text>
                        <Text style={[styles.notifTime, { color: tc.textMuted }]}>{formatNotifTime(n.date)}</Text>
                      </View>
                      <Text style={[styles.notifBody, { color: tc.textSecondary }]}>{n.body}</Text>
                    </View>

                    {!n.read && <View style={[styles.unreadDot, { backgroundColor: theme.accentColor }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyHistoryCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={[styles.emptyIconBg, { backgroundColor: tc.surface }]}>
                <Ionicons name="notifications-off-outline" size={28} color={tc.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No notifications yet</Text>
              <Text style={[styles.emptyDesc, { color: tc.textSecondary }]}>
                When you cross budget limits or get daily reminders, they will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 18,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  heroGradient: {
    padding: 20,
    position: 'relative',
  },
  specularLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bellIconContainer: {
    position: 'relative',
  },
  bellIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: '#06060D',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#D8B4FE',
    marginBottom: 16,
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  masterTextCol: {
    flex: 1,
    marginRight: 12,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  masterSub: {
    fontSize: 12,
    color: '#E9D5FF',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  featureCardCol: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  featureCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  timeSelectorRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeSelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 4,
  },
  unreadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  notifActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notifList: {
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContentCol: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  notifBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyHistoryCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
