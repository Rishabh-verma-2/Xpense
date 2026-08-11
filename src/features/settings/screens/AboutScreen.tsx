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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
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
    title: '100% Privacy & Security',
    desc: 'Your data belongs strictly to you. All transactions remain local on your device with secure server sync options.',
  },
  {
    icon: 'flash-outline',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    title: 'Instant 1-Tap Entry',
    desc: 'Log expenses and income in seconds with glowing amount displays, numpad grids, and quick preset pills.',
  },
  {
    icon: 'pie-chart-outline',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    title: 'Visual Financial Analytics',
    desc: 'Interactive monthly & yearly charts, category breakdowns, net balance trends, and budget overspend alerts.',
  },
  {
    icon: 'document-text-outline',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.12)',
    title: 'Professional Exporting',
    desc: 'Export beautifully formatted PDF statements with breakdown tables or raw CSV data for Excel analysis.',
  },
  {
    icon: 'globe-outline',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    title: 'Multi-Currency & Customization',
    desc: 'Supports 30+ world currencies (defaulting to INR ₹), custom category creation, and tailored budget limits.',
  },
];

const STATS = [
  { label: 'Currencies', value: '30+' },
  { label: 'Categories', value: '23' },
  { label: 'Privacy', value: '100%' },
  { label: 'Ads', value: '0' },
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
              colors={['#A855F7', '#7C3AED', '#5B21B6']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="wallet" size={44} color="#FFFFFF" />
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
              <Text style={styles.versionText}>v1.0.0 (Build 100)</Text>
            </View>

            <Text style={styles.tagline}>
              Empowering you to master your financial destiny with clarity, privacy, and effortless tracking.
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
              colors={['rgba(124, 58, 237, 0.15)', 'rgba(124, 58, 237, 0.03)']}
              style={styles.missionGrad}
            >
              <Text style={styles.sectionHeader}>OUR MISSION</Text>
              <Text style={styles.missionTitle}>Smart Money Management Made Effortless</Text>
              <Text style={styles.missionText}>
                Xpense was crafted to give you total control over your personal finance. We believe financial tracking should be smooth, visually delighting, and 100% private without invasive tracking or clutter.
              </Text>
            </LinearGradient>
          </View>

          {/* Core Feature Cards */}
          <Text style={styles.sectionHeader}>WHY CHOOSE XPENSE</Text>
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

          {/* Tech Stack Info Card */}
          <View style={styles.techCard}>
            <Text style={styles.sectionHeader}>BUILT WITH CUTTING-EDGE TECH</Text>
            <View style={styles.techPillsRow}>
              {['React Native', 'Expo SDK 54', 'MongoDB Atlas', 'TypeScript', 'Node.js', 'Express'].map((t) => (
                <View key={t} style={styles.techPill}>
                  <Text style={styles.techPillText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Ionicons name="heart" size={18} color="#EC4899" />
            <Text style={styles.footerText}>Designed & Crafted for Financial Freedom</Text>
            <Text style={styles.copyrightText}>© 2026 Xpense Finance Inc. All rights reserved.</Text>
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
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 30,
    marginBottom: spacing.md,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
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
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  missionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
  featuresList: {
    gap: spacing.md,
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
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 4,
  },
  featureDesc: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  techCard: {
    backgroundColor: colors.card,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  techPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
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
