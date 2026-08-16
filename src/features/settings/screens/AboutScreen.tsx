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
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { useAppTheme } from '../../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'About'>;
};

const FEATURES = [
  {
    icon: 'shield-checkmark-outline',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    title: '100% Privacy & Local-First Security',
    desc: 'Your financial data is stored securely on your device with optional encrypted MongoDB Atlas cloud synchronization.',
  },
  {
    icon: 'flash-outline',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    title: 'Lightning 1-Tap Expense Logging',
    desc: 'Add transactions in under 3 seconds with customizable categories, quick presets, and tactile glass numpad.',
  },
  {
    icon: 'pie-chart-outline',
    color: '#C084FC',
    bg: 'rgba(192, 132, 252, 0.12)',
    title: 'Visual Financial Intelligence',
    desc: 'Interactive cashflow charts, category distribution donut, MoM spending comparisons, and budget limit alerts.',
  },
  {
    icon: 'document-text-outline',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.12)',
    title: 'Executive PDF Statements & CSV',
    desc: 'Generate and share formatted financial statements with category charts or raw Excel-compatible CSV files.',
  },
  {
    icon: 'phone-portrait-outline',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    title: 'Universal Native & PWA Experience',
    desc: 'Fluid animations, offline caching, and responsive glass styling across mobile and web platforms.',
  },
  {
    icon: 'globe-outline',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    title: 'Global Multi-Currency Support',
    desc: 'Supports 30+ international currencies with instant live conversion and formatting.',
  },
];

const STATS = [
  { label: 'Privacy', value: '100%' },
  { label: 'Currencies', value: '30+' },
  { label: 'Categories', value: '25+' },
  { label: 'Ads & Bloat', value: '0' },
];

export default function AboutScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const insets = useSafeAreaInsets();

  const glowScale = useRef(new Animated.Value(0.9)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.15,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.9,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.spring(logoScale, {
      toValue: 1,
      tension: 70,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [glowScale, logoScale]);

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="About Xpense" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── App Badge Hero Card ── */}
        <View style={[styles.heroCard, { borderColor: theme.colors.cardBorderActive }]}>
          <LinearGradient
            colors={theme.heroGradient}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.specularLine} />

            {/* Glowing Logo Icon */}
            <View style={styles.logoWrap}>
              <Animated.View
                style={[
                  styles.logoGlowRing,
                  { transform: [{ scale: glowScale }] },
                ]}
              />
              <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
                <Image
                  source={require('../../../../assets/icon.png')}
                  style={styles.heroLogoImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            <Text style={styles.appName}>Xpense</Text>
            <Text style={styles.appTagline}>Personal Finance & Wealth Intelligence</Text>

            <View style={styles.versionBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.versionText}>v1.0.0 • Production Ready</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Key Statistics Row ── */}
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.statVal, { color: tc.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: tc.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Core Features Grid ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: tc.textMuted }]}>CORE CAPABILITIES</Text>
          <View style={styles.featuresList}>
            {FEATURES.map((feat) => (
              <View key={feat.title} style={[styles.featureCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={[styles.featIconBg, { backgroundColor: feat.bg }]}>
                  <Ionicons name={feat.icon as any} size={20} color={feat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featTitle, { color: tc.textPrimary }]}>{feat.title}</Text>
                  <Text style={[styles.featDesc, { color: tc.textSecondary }]}>{feat.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Architectural Highlights ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: tc.textMuted }]}>ARCHITECTURAL HIGHLIGHTS</Text>
          <View style={[styles.sectionCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.techRow}>
              <View style={styles.techIconWrap}>
                <Ionicons name="code-slash" size={16} color={theme.accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.techTitle, { color: tc.textPrimary }]}>React Native (Expo 54) + TypeScript</Text>
                <Text style={[styles.techDesc, { color: tc.textSecondary }]}>Strict type safety and 60fps native performance.</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

            <View style={styles.techRow}>
              <View style={styles.techIconWrap}>
                <Ionicons name="cloud-done-outline" size={16} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.techTitle, { color: tc.textPrimary }]}>Cloudinary & MongoDB Atlas Sync</Text>
                <Text style={[styles.techDesc, { color: tc.textSecondary }]}>Encrypted profile photo and transaction synchronization.</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

            <View style={styles.techRow}>
              <View style={styles.techIconWrap}>
                <Ionicons name="sparkles-outline" size={16} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.techTitle, { color: tc.textPrimary }]}>Luxury Adaptive Design System</Text>
                <Text style={[styles.techDesc, { color: tc.textSecondary }]}>Custom tailored HSL color tokens, dark & light themes, and spring physics.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerLoveText}>Crafted with precision for smart financial management</Text>
          <Text style={styles.footerCopyText}>© {new Date().getFullYear()} Xpense Inc. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  scrollContent: {
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
    padding: 24,
    alignItems: 'center',
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
  logoWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoGlowRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoImage: {
    width: 68,
    height: 68,
    borderRadius: 20,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  appTagline: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    marginBottom: 12,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  versionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#120F20',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },

  // Section
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
  featIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#120F20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  techIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  techDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },

  // Footer
  footerWrap: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  footerLoveText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footerCopyText: {
    fontSize: 10,
    color: '#64748B',
  },
});
