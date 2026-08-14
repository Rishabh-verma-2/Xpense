import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface LandingScreenProps {
  onLaunchApp?: () => void;
}

const FEATURES = [
  {
    icon: 'flash-outline',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    title: 'Instant Expense Logging',
    desc: 'Log income & expenses with numpad controls, preset pills, and automatic category tags.',
  },
  {
    icon: 'pie-chart-outline',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.15)',
    title: 'Monthly & Annual Analytics',
    desc: 'Overview cards, category expenditure progress, daily burn velocity, and peak spend callouts.',
  },
  {
    icon: 'shield-checkmark-outline',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
    title: 'Email OTP Security',
    desc: 'Email verification OTP codes, secure account password changes, and encrypted data storage.',
  },
  {
    icon: 'document-text-outline',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.15)',
    title: 'PDF & CSV Exporting',
    desc: 'Generate financial reports with category breakdown tables ready for download anytime.',
  },
  {
    icon: 'wallet-outline',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    title: 'Budget Management',
    desc: 'Set per-category monthly budgets and track your spending against limits in real time.',
  },
  {
    icon: 'cloud-offline-outline',
    color: '#A3E635',
    bg: 'rgba(163, 230, 53, 0.12)',
    title: 'Works Offline',
    desc: 'Transactions added offline sync automatically when your connection returns.',
  },
];

const STATS = [
  { value: '100%', label: 'Private & Local' },
  { value: '30+', label: 'Currencies' },
  { value: '⚡ 1-Tap', label: 'Expense Log' },
  { value: '🔒 OTP', label: 'Email Security' },
];

export function LandingScreen({ onLaunchApp }: LandingScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Navbar ─────────────────────────────────────────────────── */}
        <View style={styles.navbar}>
          <View style={styles.navLogoRow}>
            <View style={styles.navLogoBg}>
              <Ionicons name="wallet" size={20} color={colors.primaryLight} />
            </View>
            <Text style={styles.navLogoTitle}>
              Xpense<Text style={{ color: colors.primaryLight }}>.</Text>
            </Text>
          </View>

          {onLaunchApp && (
            <TouchableOpacity style={styles.openAppBtn} onPress={onLaunchApp} activeOpacity={0.85}>
              <Text style={styles.openAppBtnText}>Open App ➔</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <View style={styles.pwaPill}>
            <Ionicons name="phone-portrait-outline" size={13} color="#C084FC" />
            <Text style={styles.pwaPillText}>Mobile-First PWA — Works on Any Device</Text>
          </View>

          <Text style={styles.heroTitle}>
            Master Your Money{'\n'}
            <Text style={styles.heroAccent}>Effortlessly & Privately</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Track expenses, set category budgets, analyze monthly cashflow trends, and export PDF statements — right from your home screen.
          </Text>

          {/* Primary CTA */}
          {onLaunchApp && (
            <TouchableOpacity style={styles.heroCta} onPress={onLaunchApp} activeOpacity={0.88}>
              <LinearGradient
                colors={['#A855F7', '#7C3AED']}
                style={styles.heroCtaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="rocket-outline" size={20} color="#FFF" />
                <Text style={styles.heroCtaText}>Get Started — It's Free</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <Text style={styles.installHint}>
            📲 On mobile? Tap your browser menu and select{' '}
            <Text style={styles.installHintBold}>"Add to Home Screen"</Text>{' '}
            to install instantly — no app store needed.
          </Text>
        </View>

        {/* ── Stats Bar ──────────────────────────────────────────────── */}
        <View style={styles.statsBar}>
          {STATS.map((st) => (
            <View key={st.label} style={styles.statItem}>
              <Text style={styles.statVal}>{st.value}</Text>
              <Text style={styles.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Features Grid ──────────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>POWERFUL FEATURES</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={[styles.featureIconBg, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon as any} size={24} color={f.color} />
                </View>
                <Text style={styles.featureCardTitle}>{f.title}</Text>
                <Text style={styles.featureCardDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── "How it works" quick steps ─────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          {[
            { icon: 'person-add-outline', color: '#A855F7', title: 'Create Your Free Account', desc: 'Sign up with email in seconds — no credit card required.' },
            { icon: 'add-circle-outline', color: '#10B981', title: 'Log Your Transactions', desc: 'Tap the + button, enter the amount, pick a category, done.' },
            { icon: 'bar-chart-outline', color: '#06B6D4', title: 'Analyse & Export', desc: 'See where your money goes. Export PDF/CSV reports anytime.' },
          ].map((step, i) => (
            <View key={step.title} style={styles.howStep}>
              <View style={styles.howStepNum}>
                <Text style={styles.howStepNumText}>{i + 1}</Text>
              </View>
              <View style={styles.howStepIconBg}>
                <Ionicons name={step.icon as any} size={22} color={step.color} />
              </View>
              <View style={styles.howStepText}>
                <Text style={styles.howStepTitle}>{step.title}</Text>
                <Text style={styles.howStepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Final CTA ──────────────────────────────────────────────── */}
        <View style={styles.ctaCard}>
          <LinearGradient
            colors={['#2D1B69', '#1A0A4A', '#0F0728']}
            style={styles.ctaGradient}
          >
            <Ionicons name="sparkles" size={36} color="#C084FC" />
            <Text style={styles.ctaTitle}>Start Tracking Today</Text>
            <Text style={styles.ctaDesc}>
              Join thousands who manage their finances smarter with Xpense. Free, private, and always in your pocket.
            </Text>
            {onLaunchApp && (
              <TouchableOpacity style={styles.ctaBtn} onPress={onLaunchApp} activeOpacity={0.88}>
                <Text style={styles.ctaBtnText}>Launch Xpense App</Text>
                <Ionicons name="arrow-forward-circle-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Ionicons name="heart" size={14} color="#EC4899" />
          <Text style={styles.footerText}> Designed for financial freedom</Text>
          <Text style={styles.footerCopy}>© 2026 Xpense Finance Inc. All rights reserved.</Text>
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
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  navLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navLogoBg: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLogoTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  openAppBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  openAppBtnText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pwaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  pwaPillText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 12,
  },
  heroTitle: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '800',
  },
  heroAccent: {
    color: '#C084FC',
    fontWeight: '800',
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 22,
    fontSize: 14,
  },
  heroCta: {
    borderRadius: radius.full,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 280,
    marginTop: spacing.xs,
  },
  heroCtaGradient: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  heroCtaText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  installHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 320,
    marginTop: spacing.xs,
  },
  installHintBold: {
    color: colors.textSecondary,
    fontWeight: '700',
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statVal: {
    ...typography.subheading,
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: '800',
  },
  statLbl: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  // Sections
  sectionBlock: { gap: spacing.md },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
  },
  featuresGrid: { gap: spacing.md },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureCardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 16,
  },
  featureCardDesc: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  // How it works
  howStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  howStepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  howStepNumText: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 13,
  },
  howStepIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  howStepText: { flex: 1, gap: 2 },
  howStepTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 14,
  },
  howStepDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // CTA Card
  ctaCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  ctaGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaTitle: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '800',
  },
  ctaDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 300,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  ctaBtnText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    flexDirection: 'row',
  },
  footerCopy: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
});
