import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    accentColor: '#7C3AED',
    accentMuted: 'rgba(124,58,237,0.15)',
    accentGlow: 'rgba(124,58,237,0.08)',
    icon: 'wallet' as const,
    badge: 'GET STARTED',
    title: 'Welcome to\nXpense',
    subtitle: 'Your all-in-one personal finance companion. Take control of your money and build wealth — one day at a time.',
    features: [
      { icon: 'checkmark-circle', label: 'Free forever for core features' },
      { icon: 'checkmark-circle', label: '100% private — data stays on device' },
      { icon: 'checkmark-circle', label: 'Works offline, no account needed' },
    ],
    visual: 'welcome',
  },
  {
    id: '2',
    accentColor: '#06B6D4',
    accentMuted: 'rgba(6,182,212,0.15)',
    accentGlow: 'rgba(6,182,212,0.08)',
    icon: 'receipt-outline' as const,
    badge: 'STEP 1',
    title: 'Log Every\nTransaction',
    subtitle: 'Add income and expenses in seconds. Categorise, tag, and never lose track of where your money flows.',
    features: [
      { icon: 'flash', label: 'Quick-add with one tap' },
      { icon: 'pricetag', label: 'Smart auto-categorisation' },
      { icon: 'repeat', label: 'Recurring transactions support' },
    ],
    visual: 'transactions',
  },
  {
    id: '3',
    accentColor: '#10B981',
    accentMuted: 'rgba(16,185,129,0.15)',
    accentGlow: 'rgba(16,185,129,0.08)',
    icon: 'pie-chart' as const,
    badge: 'STEP 2',
    title: 'Visual\nInsights',
    subtitle: 'Beautiful charts reveal spending patterns by category, day, and month. Spot trends and make smarter decisions.',
    features: [
      { icon: 'bar-chart', label: 'Monthly income vs expense charts' },
      { icon: 'pie-chart', label: 'Category breakdown donut charts' },
      { icon: 'trending-up', label: 'Net worth trend over time' },
    ],
    visual: 'insights',
  },
  {
    id: '4',
    accentColor: '#F59E0B',
    accentMuted: 'rgba(245,158,11,0.15)',
    accentGlow: 'rgba(245,158,11,0.08)',
    icon: 'shield-checkmark' as const,
    badge: 'STEP 3',
    title: 'Budget &\nStay Safe',
    subtitle: 'Set monthly budgets per category. Get instant alerts before you overspend and hit your savings goals.',
    features: [
      { icon: 'notifications', label: 'Overspend alerts & reminders' },
      { icon: 'trophy', label: 'Savings goals with progress' },
      { icon: 'lock-closed', label: 'Secure local encrypted storage' },
    ],
    visual: 'budget',
  },
  {
    id: '5',
    accentColor: '#EC4899',
    accentMuted: 'rgba(236,72,153,0.15)',
    accentGlow: 'rgba(236,72,153,0.08)',
    icon: 'rocket' as const,
    badge: 'READY',
    title: "You're All\nSet!",
    subtitle: "Everything is ready. Start logging your first transaction and watch your financial story unfold.",
    features: [
      { icon: 'download', label: 'Export reports as CSV or PDF' },
      { icon: 'color-palette', label: 'Personalise currencies & themes' },
      { icon: 'cloud-upload', label: 'Backup & restore anytime' },
    ],
    visual: 'ready',
  },
];

// ─── Mini visual components per slide ────────────────────────────────────────
function WelcomeVisual({ color }: { color: string }) {
  return (
    <View style={[visStyles.card, { borderColor: `${color}30` }]}>
      <LinearGradient colors={[`${color}25`, `${color}08`]} style={visStyles.cardGrad}>
        <View style={visStyles.statRow}>
          {[
            { label: 'Balance', value: '₹84,200', color: '#F9FAFB' },
            { label: 'Income', value: '+₹42k', color: '#10B981' },
            { label: 'Spent', value: '-₹18k', color: '#EF4444' },
          ].map((s) => (
            <View key={s.label} style={visStyles.statBox}>
              <Text style={[visStyles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={visStyles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

function TransactionVisual({ color }: { color: string }) {
  const items = [
    { icon: 'cafe-outline', name: 'Coffee', cat: 'Food', amount: '-₹180', col: '#EF4444' },
    { icon: 'briefcase-outline', name: 'Salary', cat: 'Income', amount: '+₹42,000', col: '#10B981' },
    { icon: 'cart-outline', name: 'Groceries', cat: 'Shopping', amount: '-₹1,240', col: '#EF4444' },
  ];
  return (
    <View style={[visStyles.card, { borderColor: `${color}30` }]}>
      <LinearGradient colors={[`${color}20`, `${color}05`]} style={[visStyles.cardGrad, { gap: 10 }]}>
        {items.map((it) => (
          <View key={it.name} style={visStyles.txRow}>
            <View style={[visStyles.txIconBg, { backgroundColor: `${color}22` }]}>
              <Ionicons name={it.icon as any} size={16} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={visStyles.txName}>{it.name}</Text>
              <Text style={visStyles.txCat}>{it.cat}</Text>
            </View>
            <Text style={[visStyles.txAmt, { color: it.col }]}>{it.amount}</Text>
          </View>
        ))}
      </LinearGradient>
    </View>
  );
}

function InsightsVisual({ color }: { color: string }) {
  const bars = [60, 80, 45, 95, 55, 70, 85];
  return (
    <View style={[visStyles.card, { borderColor: `${color}30` }]}>
      <LinearGradient colors={[`${color}20`, `${color}05`]} style={visStyles.cardGrad}>
        <View style={visStyles.barsRow}>
          {bars.map((h, i) => (
            <View key={i} style={visStyles.barCol}>
              <LinearGradient
                colors={[color, `${color}60`]}
                style={[visStyles.bar, { height: h * 0.8 }]}
              />
            </View>
          ))}
        </View>
        <View style={visStyles.legendRow}>
          <View style={[visStyles.legendDot, { backgroundColor: color }]} />
          <Text style={visStyles.legendText}>Monthly spending breakdown</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function BudgetVisual({ color }: { color: string }) {
  const categories = [
    { name: 'Food', pct: 72 },
    { name: 'Transport', pct: 40 },
    { name: 'Shopping', pct: 91 },
  ];
  return (
    <View style={[visStyles.card, { borderColor: `${color}30` }]}>
      <LinearGradient colors={[`${color}20`, `${color}05`]} style={[visStyles.cardGrad, { gap: 14 }]}>
        {categories.map((c) => {
          const overSpend = c.pct > 85;
          return (
            <View key={c.name}>
              <View style={visStyles.budgRow}>
                <Text style={visStyles.budgName}>{c.name}</Text>
                <Text style={[visStyles.budgPct, { color: overSpend ? '#EF4444' : color }]}>{c.pct}%</Text>
              </View>
              <View style={visStyles.budgTrack}>
                <LinearGradient
                  colors={overSpend ? ['#EF4444', '#F87171'] : [color, `${color}80`]}
                  style={[visStyles.budgFill, { width: `${Math.min(c.pct, 100)}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          );
        })}
      </LinearGradient>
    </View>
  );
}

function ReadyVisual({ color }: { color: string }) {
  const items = [
    { icon: 'analytics-outline', label: 'Smart Reports' },
    { icon: 'settings-outline', label: 'Personalise' },
    { icon: 'share-outline', label: 'Export Data' },
    { icon: 'notifications-outline', label: 'Alerts' },
  ];
  return (
    <View style={[visStyles.card, { borderColor: `${color}30` }]}>
      <LinearGradient colors={[`${color}20`, `${color}05`]} style={visStyles.cardGrad}>
        <View style={visStyles.gridRow}>
          {items.map((it) => (
            <View key={it.label} style={[visStyles.gridItem, { backgroundColor: `${color}18` }]}>
              <Ionicons name={it.icon as any} size={22} color={color} />
              <Text style={visStyles.gridLabel}>{it.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

function SlideVisual({ type, color }: { type: string; color: string }) {
  switch (type) {
    case 'welcome':      return <WelcomeVisual color={color} />;
    case 'transactions': return <TransactionVisual color={color} />;
    case 'insights':     return <InsightsVisual color={color} />;
    case 'budget':       return <BudgetVisual color={color} />;
    case 'ready':        return <ReadyVisual color={color} />;
    default:             return null;
  }
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);
  const { updateSettings } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // per-slide entrance anims
  const slideAnims = useRef(
    SLIDES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    }))
  ).current;

  const animateSlideIn = useCallback((idx: number) => {
    slideAnims[idx].opacity.setValue(0);
    slideAnims[idx].translateY.setValue(30);
    Animated.parallel([
      Animated.timing(slideAnims[idx].opacity, {
        toValue: 1, duration: 420, useNativeDriver: true,
      }),
      Animated.spring(slideAnims[idx].translateY, {
        toValue: 0, tension: 70, friction: 9, useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnims]);

  // animate first slide on mount
  React.useEffect(() => {
    animateSlideIn(0);
  }, []);

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
      animateSlideIn(next);
    }
  };

  const handleGetStarted = async () => {
    await updateSettings({ onboardingCompleted: true });
    navigation.replace('Login');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / width);
    if (idx !== currentIndex && idx >= 0 && idx < SLIDES.length) {
      setCurrentIndex(idx);
      animateSlideIn(idx);
    }
    Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
      useNativeDriver: false,
    })(e);
  };

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Top Header Row with Skip Button */}
      <View style={styles.topHeader}>
        <View style={styles.topLogoRow}>
          <Ionicons name="wallet" size={20} color={colors.primaryLight} />
          <Text style={styles.topLogoTitle}>Xpense</Text>
        </View>

        <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.7} style={styles.topSkipBtn}>
          <Text style={styles.topSkipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Scrollable slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <Animated.View
            key={s.id}
            style={[
              styles.slide,
              {
                opacity: slideAnims[i].opacity,
                transform: [{ translateY: slideAnims[i].translateY }],
              },
            ]}
          >
            {/* Background radial glow */}
            <View style={[styles.bgGlow, { backgroundColor: s.accentGlow }]} />

            {/* Badge */}
            <View style={[styles.badge, { backgroundColor: s.accentMuted, borderColor: `${s.accentColor}40` }]}>
              <Text style={[styles.badgeText, { color: s.accentColor }]}>{s.badge}</Text>
            </View>

            {/* Main icon */}
            <View style={[styles.iconRing, { borderColor: `${s.accentColor}30` }]}>
              <LinearGradient
                colors={[`${s.accentColor}30`, `${s.accentColor}10`]}
                style={styles.iconBg}
              >
                <Ionicons name={s.icon} size={52} color={s.accentColor} />
              </LinearGradient>
            </View>

            {/* Visual preview card */}
            <SlideVisual type={s.visual} color={s.accentColor} />

            {/* Text */}
            <View style={styles.textBlock}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.subtitle}>{s.subtitle}</Text>
            </View>

            {/* Feature list */}
            <View style={styles.featureList}>
              {s.features.map((f, fi) => (
                <View key={fi} style={styles.featureRow}>
                  <View style={[styles.featureIconBg, { backgroundColor: `${s.accentColor}20` }]}>
                    <Ionicons name={f.icon as any} size={14} color={s.accentColor} />
                  </View>
                  <Text style={styles.featureText}>{f.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.md }]}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => {
            const isActive = i === currentIndex;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  scrollRef.current?.scrollTo({ x: i * width, animated: true });
                  setCurrentIndex(i);
                  animateSlideIn(i);
                }}
                style={[
                  styles.dot,
                  isActive && { width: 28, backgroundColor: slide.accentColor },
                  !isActive && { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}
              />
            );
          })}
        </View>

        {/* Step counter */}
        <Text style={styles.stepCounter}>{currentIndex + 1} of {SLIDES.length}</Text>

        {/* Action buttons */}
        {isLast ? (
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.88} style={styles.primaryBtn}>
            <LinearGradient
              colors={[slide.accentColor, `${slide.accentColor}CC`]}
              style={styles.primaryGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryText}>Start Tracking</Text>
              <Ionicons name="rocket" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.7} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToNext} activeOpacity={0.88} style={styles.nextBtn}>
              <LinearGradient
                colors={[slide.accentColor, `${slide.accentColor}CC`]}
                style={styles.nextGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  topLogoTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  topSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topSkipText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  bgGlow: {
    position: 'absolute',
    top: -80,
    width: width * 1.2,
    height: height * 0.5,
    borderRadius: width * 0.6,
    alignSelf: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.label,
    letterSpacing: 2,
  },
  iconRing: {
    borderWidth: 1.5,
    borderRadius: 40,
    padding: 6,
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: colors.background,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 6,
    width: 8,
    borderRadius: 3,
  },
  stepCounter: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  nextBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  nextText: {
    ...typography.bodyMedium,
    color: '#FFF',
  },
  primaryBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
  },
  primaryText: {
    ...typography.subheading,
    color: '#FFF',
  },
});

// ─── Visual card styles ───────────────────────────────────────────────────────
const visStyles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGrad: {
    padding: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(156,163,175,0.7)',
    fontWeight: '500',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  txCat: {
    fontSize: 11,
    color: 'rgba(156,163,175,0.7)',
  },
  txAmt: {
    fontSize: 13,
    fontWeight: '700',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 80,
    marginBottom: spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 80,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: 'rgba(156,163,175,0.7)',
    fontWeight: '500',
  },
  budgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgName: {
    fontSize: 12,
    color: '#F9FAFB',
    fontWeight: '600',
  },
  budgPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  budgTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  budgFill: {
    height: '100%',
    borderRadius: 3,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  gridItem: {
    width: '44%',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#F9FAFB',
    fontWeight: '600',
    textAlign: 'center',
  },
});
