import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Linking,
  Easing,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'About'>;
};

const FEATURES = [
  {
    icon: 'shield-checkmark-outline',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    title: '100% Privacy & Local-First Security',
    desc: 'Your data belongs strictly to you. All transactions are securely stored locally with optional encrypted MongoDB Atlas cloud synchronization.',
  },
  {
    icon: 'flash-outline',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    title: 'Lightning 1-Tap Expense Logging',
    desc: 'Add transactions in under 3 seconds with customizable categories, payment method pills, smart numpad, and instant calculations.',
  },
  {
    icon: 'pie-chart-outline',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    title: 'Visual Financial Intelligence',
    desc: 'Interactive monthly & annual cashflow charts, category distribution bars, MoM spending comparisons, and budget limit alerts.',
  },
  {
    icon: 'document-text-outline',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.12)',
    title: 'Executive PDF Statements & CSV',
    desc: 'Generate and automatically download formatted financial statements with KPI cards, category breakdown charts, or raw Excel-ready CSV files.',
  },
  {
    icon: 'phone-portrait-outline',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    title: 'Universal PWA Experience',
    desc: 'Installable directly from Chrome or Safari to your mobile home screen with full-screen native feel, offline caching, and zero app store delays.',
  },
  {
    icon: 'globe-outline',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    title: 'Global Multi-Currency Support',
    desc: 'Supports 30+ international currencies (defaulting to INR ₹), custom user categories, and granular budget allocation.',
  },
];

const STATS = [
  { label: 'Privacy', value: '100%' },
  { label: 'Currencies', value: '30+' },
  { label: 'Categories', value: '23' },
  { label: 'Ads & Bloat', value: '0' },
];

const HIGHLIGHTS = [
  {
    icon: 'cloud-offline-outline',
    title: 'Offline Sync Engine',
    desc: 'Log expenses anywhere without network. Changes automatically queue and sync once online.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'JWT & SSL Email Reset',
    desc: 'Protected with cryptographic JWT tokens and 6-digit OTP verification via Gmail SMTP.',
  },
  {
    icon: 'speedometer-outline',
    title: 'Zero Latency Performance',
    desc: 'Built with React Native Web and Expo 54 for silky 60fps animations and instant interaction.',
  },
];

export default function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // Entrance Animations
  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(20)).current;

  const contentFade = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  const glowScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Ambient Glow Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.9,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered Entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(headerTranslateY, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="About Xpense" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Animated Hero Header */}
        <View style={styles.heroSection}>
          {/* Ambient Glow */}
          <Animated.View style={[styles.glowRing, { transform: [{ scale: glowScale }] }]} />

          {/* Logo Badge */}
          <Animated.View
            style={[
              styles.logoBadge,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['#A855F7', '#7C3AED', '#4C1D95']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="wallet-outline" size={42} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          {/* Title & Version */}
          <Animated.View
            style={{
              opacity: headerFade,
              transform: [{ translateY: headerTranslateY }],
              alignItems: 'center',
            }}
          >
            <Text style={styles.appName}>
              Xpense<Text style={styles.dot}>.</Text>
            </Text>

            <View style={styles.versionBadge}>
              <Ionicons name="sparkles" size={13} color="#C084FC" style={{ marginRight: 4 }} />
              <Text style={styles.versionText}>v1.0.0 — Executive Edition (PWA)</Text>
            </View>

            <Text style={styles.tagline}>
              Empowering you to master your personal finance with clarity, privacy, and effortless tracking across web and mobile devices.
            </Text>
          </Animated.View>
        </View>

        {/* Animated Main Content */}
        <Animated.View
          style={{
            opacity: contentFade,
            transform: [{ translateY: contentTranslateY }],
            gap: spacing.lg,
          }}
        >
          {/* Stats Bar */}
          <View style={styles.statsRow}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Mission Card */}
          <View style={styles.missionCard}>
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.18)', 'rgba(124, 58, 237, 0.04)']}
              style={styles.missionGrad}
            >
              <Text style={styles.sectionHeader}>OUR PHILOSOPHY</Text>
              <Text style={styles.missionTitle}>Smart Financial Control Without Compromise</Text>
              <Text style={styles.missionText}>
                Xpense was engineered from the ground up to eliminate the friction of personal budgeting. No invasive advertisements, no selling of user financial data, and no slow loading times — just a beautiful, fast, and secure money companion.
              </Text>
            </LinearGradient>
          </View>

          {/* Core Feature Cards */}
          <Text style={styles.sectionHeader}>KEY CAPABILITIES</Text>
          <View style={styles.featuresList}>
            {FEATURES.map((feat) => (
              <View key={feat.title} style={styles.featureCard}>
                <View style={[styles.featureIconBg, { backgroundColor: feat.bg }]}>
                  <Ionicons name={feat.icon as any} size={22} color={feat.color} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>{feat.title}</Text>
                  <Text style={styles.featureDesc}>{feat.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Technical Architecture Highlights */}
          <Text style={styles.sectionHeader}>ENGINEERING & SECURITY</Text>
          <View style={styles.highlightsList}>
            {HIGHLIGHTS.map((h) => (
              <View key={h.title} style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <View style={styles.highlightIcon}>
                    <Ionicons name={h.icon as any} size={18} color="#C084FC" />
                  </View>
                  <Text style={styles.highlightTitle}>{h.title}</Text>
                </View>
                <Text style={styles.highlightDesc}>{h.desc}</Text>
              </View>
            ))}
          </View>

          {/* Tech Stack Info Card */}
          <View style={styles.techCard}>
            <Text style={styles.sectionHeader}>BUILT WITH MODERN WEB & MOBILE TECH</Text>
            <View style={styles.techPillsRow}>
              {[
                'React Native Web',
                'PWA Service Worker v4',
                'jsPDF Direct Exporter',
                'Nodemailer SSL Transport',
                'Expo SDK 54',
                'MongoDB Atlas',
                'TypeScript',
                'Node.js & Express',
              ].map((t) => (
                <View key={t} style={styles.techPill}>
                  <Text style={styles.techPillText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Help & Feedback Card */}
          <View style={styles.aboutActionsCard}>
            <Text style={styles.sectionHeader}>SUPPORT & COMMUNITY</Text>
            <View style={styles.aboutBtnRow}>
              <TouchableOpacity
                style={styles.aboutActionBtn}
                onPress={() => navigation.navigate('Feedback')}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={colors.primaryLight} />
                <Text style={styles.aboutActionBtnText}>Send Feedback</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aboutActionBtn}
                onPress={() => navigation.navigate('HelpFaq')}
                activeOpacity={0.8}
              >
                <Ionicons name="help-circle-outline" size={18} color={colors.primaryLight} />
                <Text style={styles.aboutActionBtnText}>Help & FAQs</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <View style={styles.footerHeartRow}>
              <Ionicons name="heart" size={16} color="#EC4899" />
              <Text style={styles.footerText}>Crafted for Financial Freedom & Simplicity</Text>
            </View>
            <Text style={styles.copyrightText}>© 2026 Xpense Finance. All rights reserved.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    top: 0,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    marginBottom: spacing.md,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.4)',
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  dot: {
    color: colors.primaryLight,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: spacing.md,
  },
  versionText: {
    ...typography.caption,
    color: '#D8B4FE',
    fontSize: 12,
    fontWeight: '700',
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  missionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    overflow: 'hidden',
  },
  missionGrad: {
    padding: spacing.lg,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.2,
    fontSize: 11,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  missionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  missionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 13,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
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
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 4,
    fontWeight: '700',
  },
  featureDesc: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  highlightsList: {
    gap: spacing.sm,
  },
  highlightCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  highlightIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  highlightDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    paddingLeft: 36,
  },
  techCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  techPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  techPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  techPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  aboutActionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  aboutBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  aboutActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    gap: 6,
  },
  aboutActionBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryLight,
    fontSize: 12,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  footerHeartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 13,
  },
  copyrightText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
});
