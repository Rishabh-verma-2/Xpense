import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface LandingScreenProps {
  onLaunchApp?: () => void;
}

export function LandingScreen({ onLaunchApp }: LandingScreenProps) {
  const insets = useSafeAreaInsets();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      window.addEventListener('appinstalled', () => {
        setIsInstallable(false);
        setInstalledSuccess(true);
      });

      return () => {
        if (typeof window.removeEventListener === 'function') {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
      };
    }
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show iOS or manual install instructions
      setShowIosInstructions(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Navbar */}
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
            <TouchableOpacity style={styles.launchBtn} onPress={onLaunchApp} activeOpacity={0.85}>
              <Text style={styles.launchBtnText}>Open App ➔</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Banner */}
        <View style={styles.heroSection}>
          <View style={styles.pwaPill}>
            <Ionicons name="sparkles" size={14} color="#C084FC" />
            <Text style={styles.pwaPillText}>PWA Enabled — Install on Any Device</Text>
          </View>

          <Text style={styles.heroTitle}>
            Master Your Money{'\n'}
            <Text style={styles.heroTitleGradient}>Effortlessly & Privately</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Track expenses, set category budgets, analyze monthly cashflow trends, and export PDF statements — right from your home screen.
          </Text>

          {/* Action Buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.installBtn} onPress={handleInstallPwa} activeOpacity={0.88}>
              <LinearGradient
                colors={['#A855F7', '#7C3AED']}
                style={styles.installGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="download-outline" size={20} color="#FFF" />
                <Text style={styles.installBtnText}>
                  {installedSuccess ? 'App Installed! 🎉' : 'Add to Home Screen'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {onLaunchApp && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={onLaunchApp} activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>Launch Web App</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* App Showcase Stats Bar */}
        <View style={styles.statsBar}>
          {[
            { value: '100%', label: 'Private & Local' },
            { value: '30+', label: 'Currencies' },
            { value: '⚡ 1-Tap', label: 'Expense Log' },
            { value: '🔒 OTP', label: 'Email Security' },
          ].map((st) => (
            <View key={st.label} style={styles.statItem}>
              <Text style={styles.statVal}>{st.value}</Text>
              <Text style={styles.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Feature Grid */}
        <Text style={styles.sectionHeader}>POWERFUL FEATURES</Text>
        <View style={styles.featuresGrid}>
          {[
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
              desc: 'Glassmorphic overview cards, category expenditure progress, daily burn velocity, and peak spend callouts.',
            },
            {
              icon: 'shield-checkmark-outline',
              color: '#10B981',
              bg: 'rgba(16, 185, 129, 0.15)',
              title: 'Nodemailer Security',
              desc: 'Email verification OTP codes, secure account password changes, and encrypted data storage.',
            },
            {
              icon: 'document-text-outline',
              color: '#06B6D4',
              bg: 'rgba(6, 182, 212, 0.15)',
              title: 'PDF & CSV Exporting',
              desc: 'Generate financial reports with category breakdown tables ready for download anytime.',
            },
          ].map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={[styles.featureIconBg, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon as any} size={24} color={f.color} />
              </View>
              <Text style={styles.featureCardTitle}>{f.title}</Text>
              <Text style={styles.featureCardDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* PWA Install Footer CTA */}
        <View style={styles.ctaCard}>
          <LinearGradient
            colors={['#2D1B69', '#1A0A4A', '#0F0728']}
            style={styles.ctaGradient}
          >
            <Ionicons name="phone-portrait-outline" size={36} color="#C084FC" />
            <Text style={styles.ctaTitle}>Install Xpense on Your Mobile</Text>
            <Text style={styles.ctaDesc}>
              No app store download needed. Install directly to your home screen for offline access and full-screen experience.
            </Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={handleInstallPwa} activeOpacity={0.88}>
              <Text style={styles.ctaBtnText}>Add Xpense to Home Screen</Text>
              <Ionicons name="add-circle-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Xpense Finance Inc. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* iOS & Manual Installation Instructions Modal */}
      <Modal
        visible={showIosInstructions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIosInstructions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="phone-portrait" size={24} color={colors.primaryLight} />
              <Text style={styles.modalTitle}>How to Install Xpense</Text>
            </View>

            <Text style={styles.modalSubtitle}>Follow these steps to add Xpense to your home screen:</Text>

            <View style={styles.stepRow}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.stepText}>Tap the <Text style={styles.boldText}>Share</Text> button in your browser toolbar.</Text>
            </View>

            <View style={styles.stepRow}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepText}>Scroll down and tap <Text style={styles.boldText}>"Add to Home Screen"</Text> 📲.</Text>
            </View>

            <View style={styles.stepRow}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepText}>Tap <Text style={styles.boldText}>"Add"</Text> in top right corner. Done!</Text>
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowIosInstructions(false)}>
              <Text style={styles.closeModalText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
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
    fontSize: 20,
    fontWeight: '800',
  },
  launchBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  launchBtnText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
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
    lineHeight: 40,
  },
  heroTitleGradient: {
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
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    width: '100%',
    justifyContent: 'center',
  },
  installBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
    flex: 1,
    maxWidth: 220,
  },
  installGradient: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  installBtnText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryBtn: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondaryBtnText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
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

  sectionHeader: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
  },
  featuresGrid: {
    gap: spacing.md,
  },
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
    fontSize: 20,
    textAlign: 'center',
  },
  ctaDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
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

  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 18,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    color: colors.primaryLight,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '800',
    fontSize: 12,
  },
  stepText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 13,
  },
  boldText: {
    fontWeight: '700',
    color: colors.primaryLight,
  },
  closeModalBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  closeModalText: {
    ...typography.bodyMedium,
    color: '#FFF',
    fontWeight: '700',
  },
});
