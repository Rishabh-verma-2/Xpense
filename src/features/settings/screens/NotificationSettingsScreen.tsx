import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useToast } from '../../../context/ToastContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'NotificationSettings'>;
};

interface UpcomingFeature {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  tag: string;
}

const UPCOMING_FEATURES: UpcomingFeature[] = [
  {
    id: 'budget_thresholds',
    icon: 'warning-outline',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    title: 'Smart Budget Alerts',
    description: 'Instant warning notifications when you reach 70%, 90%, or 100% of any category budget limit.',
    tag: 'Next Update',
  },
  {
    id: 'daily_reminder',
    icon: 'alarm-outline',
    iconColor: '#7C3AED',
    iconBg: 'rgba(124, 58, 237, 0.15)',
    title: 'Daily Expense Logging Ping',
    description: 'A customizable daily evening reminder to log your cash spends, invoices, and receipts before bed.',
    tag: 'Next Update',
  },
  {
    id: 'weekly_digest',
    icon: 'stats-chart-outline',
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    title: 'Weekly Financial Digest',
    description: 'Every Sunday, get a summarized breakdown of where your money went and your total savings rate.',
    tag: 'Planned',
  },
  {
    id: 'bill_reminders',
    icon: 'calendar-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59, 130, 246, 0.15)',
    title: 'Bill & Due Date Reminders',
    description: 'Proactive reminders before recurring subscriptions, utility bills, and EMI payments are due.',
    tag: 'Planned',
  },
];

export default function NotificationSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showSuccess, showInfo } = useToast();
  const [notifyEarlyAccess, setNotifyEarlyAccess] = useState(true);

  const handleToggleWaitlist = (val: boolean) => {
    setNotifyEarlyAccess(val);
    if (val) {
      showSuccess(
        'Early Access Enabled 🚀',
        "You're on the priority list! You will get notification features as soon as they roll out."
      );
    } else {
      showInfo(
        'Waitlist Updated',
        'You have opted out of early notification feature alerts.'
      );
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero "Coming Soon" Banner ── */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#2D1B69', '#1A0A4A', '#0F0B24']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Background glowing circles */}
            <View style={styles.decorGlow1} />
            <View style={styles.decorGlow2} />

            <View style={styles.heroHeader}>
              <View style={styles.bellIconContainer}>
                <LinearGradient
                  colors={[colors.primaryLight, colors.primaryDark]}
                  style={styles.bellIconGradient}
                >
                  <Ionicons name="notifications" size={28} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.pulseDot} />
              </View>

              <View style={styles.comingSoonPill}>
                <Text style={styles.comingSoonPillText}>⚡ COMING SOON</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Push Notifications & Alerts</Text>
            <Text style={styles.heroSubtitle}>
              We are actively developing an intelligent, battery-efficient notification
              engine to keep your budget on track without needing to open the app every hour.
            </Text>

            {/* Early Access toggle row */}
            <View style={styles.waitlistCard}>
              <View style={styles.waitlistInfo}>
                <Text style={styles.waitlistTitle}>Notify Me on Launch</Text>
                <Text style={styles.waitlistSub}>
                  Get early beta access and instant activation when ready.
                </Text>
              </View>
              <Switch
                value={notifyEarlyAccess}
                onValueChange={handleToggleWaitlist}
                trackColor={{ false: '#2A2A3A', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </LinearGradient>
        </View>

        {/* ── Upcoming Features Section ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>What’s In The Works</Text>
          <View style={styles.tagPreview}>
            <Text style={styles.tagPreviewText}>PREVIEW</Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          {UPCOMING_FEATURES.map((item) => (
            <View key={item.id} style={styles.featureCard}>
              <View style={[styles.featureIconBg, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>
              <View style={styles.featureInfo}>
                <View style={styles.featureTitleRow}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.featureDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Help / Status Note ── */}
        <View style={styles.footerNote}>
          <Ionicons name="sparkles-outline" size={16} color={colors.primaryLight} />
          <Text style={styles.footerNoteText}>
            Have ideas for notifications or custom alerts? Reach out via About & Feedback!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Hero Card
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  heroGradient: {
    padding: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  decorGlow1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  decorGlow2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bellIconContainer: {
    position: 'relative',
  },
  bellIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1A0A4A',
  },
  comingSoonPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.45)',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  comingSoonPillText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: '#D8B4FE',
    letterSpacing: 0.8,
  },
  heroTitle: {
    ...typography.heading,
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(229, 231, 235, 0.85)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  waitlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: spacing.md,
  },
  waitlistInfo: {
    flex: 1,
  },
  waitlistTitle: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  waitlistSub: {
    ...typography.caption,
    color: 'rgba(209, 213, 219, 0.75)',
    marginTop: 2,
    fontSize: 11,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionHeaderTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  tagPreview: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tagPreviewText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },

  // Features List
  featuresList: {
    gap: spacing.sm + 2,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: spacing.xs,
  },
  featureTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 17,
  },

  // Footer Note
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    gap: spacing.sm,
  },
  footerNoteText: {
    ...typography.caption,
    color: colors.primaryLight,
    flex: 1,
    lineHeight: 16,
  },
});
