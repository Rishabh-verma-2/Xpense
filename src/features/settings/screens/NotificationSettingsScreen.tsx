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
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { useToast } from '../../../context/ToastContext';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { useAppTheme } from '../../../context/ThemeContext';

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
    description: 'Instant warning notifications when you reach 80% or 100% of any category budget limit.',
    tag: 'Next Update',
  },
  {
    id: 'daily_reminder',
    icon: 'alarm-outline',
    iconColor: '#C084FC',
    iconBg: 'rgba(192, 132, 252, 0.15)',
    title: 'Daily Evening Expense Ping',
    description: 'A customizable daily evening reminder to log your cash spends and invoices before bed.',
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
    iconColor: '#38BDF8',
    iconBg: 'rgba(56, 189, 248, 0.15)',
    title: 'Bill & Due Date Reminders',
    description: 'Proactive reminders before recurring subscriptions, utility bills, and EMI payments are due.',
    tag: 'Planned',
  },
];

export default function NotificationSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showSuccess, showInfo } = useToast();
  const { theme } = useAppTheme();
  const tc = theme.colors;
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
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Notifications & Alerts" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero "Coming Soon" Banner ── */}
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
                <LinearGradient
                  colors={theme.accentGradient}
                  style={styles.bellIconGradient}
                >
                  <Ionicons name="notifications" size={26} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.pulseDot} />
              </View>

              <View style={[styles.comingSoonPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={styles.comingSoonPillText}>NEXT MAJOR UPDATE</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Proactive Alert Center</Text>
            <Text style={styles.heroDescription}>
              We are building a smart push notification engine with local alarms to give you real-time spend warnings and gentle reminders.
            </Text>

            {/* Early access toggle */}
            <View style={[styles.waitlistRow, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <View style={styles.waitlistTextCol}>
                <Text style={styles.waitlistTitle}>Notify Me on Launch</Text>
                <Text style={styles.waitlistSub}>Be the first to test smart budget & bill reminders</Text>
              </View>
              <Switch
                value={notifyEarlyAccess}
                onValueChange={handleToggleWaitlist}
                trackColor={{ false: '#1A162B', true: `${theme.accentColor}55` }}
                thumbColor={notifyEarlyAccess ? theme.accentColor : '#64748B'}
              />
            </View>
          </LinearGradient>
        </View>

        {/* ── Roadmap Feature Cards ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: tc.textMuted }]}>ALERT ROADMAP</Text>
          <View style={styles.featuresList}>
            {UPCOMING_FEATURES.map((item) => (
              <View key={item.id} style={[styles.featureCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>

                <View style={styles.featureInfo}>
                  <View style={styles.featureTitleRow}>
                    <Text style={[styles.featureTitle, { color: tc.textPrimary }]}>{item.title}</Text>
                    <View
                      style={[
                        styles.tagPill,
                        item.tag === 'Next Update' ? styles.tagNext : styles.tagPlanned,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          item.tag === 'Next Update' ? styles.tagTextNext : styles.tagTextPlanned,
                        ]}
                      >
                        {item.tag}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.featureDescription, { color: tc.textSecondary }]}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Help / Suggestions Footer Callout ── */}
        <TouchableOpacity
          style={[styles.footerCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
          onPress={() => navigation.navigate('Feedback')}
          activeOpacity={0.8}
        >
          <Ionicons name="bulb-outline" size={18} color={theme.accentColor} />
          <Text style={[styles.footerText, { color: tc.textSecondary }]}>
            Have a custom alert idea? Suggest it to our engineering team!
          </Text>
          <Ionicons name="chevron-forward" size={16} color={tc.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Full clearance for floating bottom bar
    gap: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(192, 132, 252, 0.3)',
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
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#150A2E',
  },
  comingSoonPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D8B4FE',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  waitlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  waitlistTextCol: {
    flex: 1,
  },
  waitlistTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  waitlistSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Roadmap Section
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginLeft: 4,
  },
  featuresList: {
    gap: 8,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#120F20',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagNext: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tagPlanned: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  tagTextNext: {
    color: '#34D399',
  },
  tagTextPlanned: {
    color: '#94A3B8',
  },
  featureDescription: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
  },

  // Footer Card
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120F20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    gap: 10,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
});
