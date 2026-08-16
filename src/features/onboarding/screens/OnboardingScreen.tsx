import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  Image,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useSettings } from '../../../context/SettingsContext';
import { typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';
import { useAppTheme } from '../../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    accentColor: '#8B5CF6',
    accentGradient: ['#8B5CF6', '#6D28D9'] as const,
    accentMuted: 'rgba(139, 92, 246, 0.16)',
    accentGlow: 'rgba(139, 92, 246, 0.12)',
    icon: 'wallet-outline' as const,
    badge: 'LUXURY FINANCE',
    title: 'Master Your Money\nWith Precision',
    subtitle: 'The modern, ultra-private expense tracker engineered for high clarity, smart budgets, and financial freedom.',
    features: [
      { icon: 'shield-checkmark', label: '100% On-Device Privacy & Encryption' },
      { icon: 'flash', label: 'Lightning-fast transaction logging' },
      { icon: 'cloud-offline', label: 'Works completely offline without accounts' },
    ],
    visual: 'welcome',
  },
  {
    id: '2',
    accentColor: '#06B6D4',
    accentGradient: ['#06B6D4', '#0891B2'] as const,
    accentMuted: 'rgba(6, 182, 212, 0.16)',
    accentGlow: 'rgba(6, 182, 212, 0.12)',
    icon: 'receipt-outline' as const,
    badge: 'EFFORTLESS LOGGING',
    title: 'Log Outflow & Inflow\nIn Under 3 Seconds',
    subtitle: 'Tactile numeric keypad, smart custom categories, split methods (UPI, Card, Cash), and quick amount chips.',
    features: [
      { icon: 'pricetag', label: 'Multi-category tagging with custom icons & colors' },
      { icon: 'card', label: 'Track by payment mode (Cash, UPI, Credit, Bank)' },
      { icon: 'time', label: 'Historical timestamps & searchable notes' },
    ],
    visual: 'transactions',
  },
  {
    id: '3',
    accentColor: '#10B981',
    accentGradient: ['#10B981', '#059669'] as const,
    accentMuted: 'rgba(16, 185, 129, 0.16)',
    accentGlow: 'rgba(16, 185, 129, 0.12)',
    icon: 'pie-chart-outline' as const,
    badge: 'VISUAL INTELLIGENCE',
    title: 'Crystal Clear Charts\n& Deep Analytics',
    subtitle: 'Interactive donut rings, daily outflow bar charts, month-over-month trends, and category breakdown drilldowns.',
    features: [
      { icon: 'bar-chart', label: 'Daily spending pace & burn velocity' },
      { icon: 'pie-chart', label: 'Category distribution breakdown' },
      { icon: 'trending-up', label: 'MoM expense percentage indicators' },
    ],
    visual: 'insights',
  },
  {
    id: '4',
    accentColor: '#F59E0B',
    accentGradient: ['#F59E0B', '#D97706'] as const,
    accentMuted: 'rgba(245, 158, 11, 0.16)',
    accentGlow: 'rgba(245, 158, 11, 0.12)',
    icon: 'speedometer-outline' as const,
    badge: 'SMART BUDGETS',
    title: 'Spending Limits &\nOverspend Warnings',
    subtitle: 'Set monthly limits across specific categories or overall balance. Get proactive visual alerts before exceeding.',
    features: [
      { icon: 'alert-circle', label: 'Dynamic 80% warning and 100% danger alerts' },
      { icon: 'calculator', label: 'Daily safe burn allowance calculations' },
      { icon: 'trophy', label: 'Track savings rate & retained wealth' },
    ],
    visual: 'budget',
  },
  {
    id: '5',
    accentColor: '#EC4899',
    accentGradient: ['#EC4899', '#DB2777'] as const,
    accentMuted: 'rgba(236, 72, 153, 0.16)',
    accentGlow: 'rgba(236, 72, 153, 0.12)',
    icon: 'sparkles-outline' as const,
    badge: 'COMPLETE TOOLKIT',
    title: 'Tailored For You\nEvery Step of the Way',
    subtitle: 'Switch between 5 luxury themes, 20+ global currencies, and export beautiful CSV/PDF reports anytime.',
    features: [
      { icon: 'color-palette', label: '5 hand-crafted dark & light themes' },
      { icon: 'globe', label: 'Global currency support with symbols' },
      { icon: 'download', label: 'One-click CSV & PDF export' },
    ],
    visual: 'ready',
  },
];

// ─── Interactive Flashcard Previews ──────────────────────────────────────────

function WelcomeFlashcard({ color, tc, mode }: { color: string; tc: any; mode: string }) {
  return (
    <View style={[visStyles.flashcardWrapper, { backgroundColor: tc.card, borderColor: `${color}40` }]}>
      <LinearGradient
        colors={mode === 'light' ? ['rgba(248,250,252,0.95)', '#FFFFFF'] : [`${color}20`, 'rgba(15,10,30,0.85)']}
        style={visStyles.flashcardGradient}
      >
        {/* Top Header Pill */}
        <View style={visStyles.cardTopRow}>
          <View style={visStyles.liveTagRow}>
            <View style={[visStyles.liveDot, { backgroundColor: '#10B981' }]} />
            <Text style={[visStyles.cardSubtitle, { color: tc.textMuted }]}>PORTFOLIO SNAPSHOT</Text>
          </View>
          <View style={[visStyles.trustBadge, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
            <Ionicons name="lock-closed" size={10} color={color} />
            <Text style={[visStyles.trustBadgeText, { color }]}>On-Device</Text>
          </View>
        </View>

        {/* Big Balance Number */}
        <View style={visStyles.balanceBlock}>
          <Text style={[visStyles.balanceMain, { color: tc.textPrimary }]}>₹1,24,850</Text>
          <Text style={[visStyles.balanceLabel, { color: tc.textMuted }]}>Net Available Balance</Text>
        </View>

        {/* Split Metrics Strip */}
        <View style={[visStyles.metricsStrip, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
          <View style={visStyles.metricCol}>
            <View style={visStyles.metricHeaderRow}>
              <Ionicons name="arrow-down" size={12} color="#10B981" />
              <Text style={[visStyles.metricSmallLabel, { color: tc.textMuted }]}>Inflow</Text>
            </View>
            <Text style={[visStyles.metricValue, { color: '#10B981' }]}>+₹65,000</Text>
          </View>

          <View style={[visStyles.metricDivider, { backgroundColor: tc.cardBorder }]} />

          <View style={visStyles.metricCol}>
            <View style={visStyles.metricHeaderRow}>
              <Ionicons name="arrow-up" size={12} color="#F43F5E" />
              <Text style={[visStyles.metricSmallLabel, { color: tc.textMuted }]}>Outflow</Text>
            </View>
            <Text style={[visStyles.metricValue, { color: '#F43F5E' }]}>-₹21,400</Text>
          </View>

          <View style={[visStyles.metricDivider, { backgroundColor: tc.cardBorder }]} />

          <View style={visStyles.metricCol}>
            <View style={visStyles.metricHeaderRow}>
              <Ionicons name="sparkles" size={12} color={color} />
              <Text style={[visStyles.metricSmallLabel, { color: tc.textMuted }]}>Saved</Text>
            </View>
            <Text style={[visStyles.metricValue, { color }]}>67%</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function TransactionsFlashcard({ color, tc, mode }: { color: string; tc: any; mode: string }) {
  const sampleTxs = [
    { icon: 'cafe', name: 'Artisan Coffee', category: 'Dining', amount: '-₹180', color: '#F43F5E', mode: 'UPI' },
    { icon: 'briefcase', name: 'Client Retainer', category: 'Salary', amount: '+₹45,000', color: '#10B981', mode: 'Bank' },
    { icon: 'cart', name: 'Weekly Groceries', category: 'Supermarket', amount: '-₹1,620', color: '#F43F5E', mode: 'Card' },
  ];

  return (
    <View style={[visStyles.flashcardWrapper, { backgroundColor: tc.card, borderColor: `${color}40` }]}>
      <LinearGradient
        colors={mode === 'light' ? ['rgba(248,250,252,0.95)', '#FFFFFF'] : [`${color}20`, 'rgba(15,10,30,0.85)']}
        style={visStyles.flashcardGradient}
      >
        <View style={visStyles.cardTopRow}>
          <Text style={[visStyles.cardSubtitle, { color: tc.textMuted }]}>INSTANT TRANSACTION FEED</Text>
          <View style={[visStyles.quickAddChip, { backgroundColor: `${color}20`, borderColor: color }]}>
            <Ionicons name="add" size={12} color={color} />
            <Text style={[visStyles.quickAddText, { color }]}>One-Tap Log</Text>
          </View>
        </View>

        <View style={visStyles.txListContainer}>
          {sampleTxs.map((tx, idx) => (
            <View key={idx} style={[visStyles.txItemRow, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
              <View style={[visStyles.txIconCircle, { backgroundColor: `${tx.color}22` }]}>
                <Ionicons name={tx.icon as any} size={15} color={tx.color} />
              </View>

              <View style={visStyles.txInfoCol}>
                <Text style={[visStyles.txTitleText, { color: tc.textPrimary }]} numberOfLines={1}>{tx.name}</Text>
                <Text style={[visStyles.txCategoryText, { color: tc.textMuted }]}>{tx.category} • {tx.mode}</Text>
              </View>

              <Text style={[visStyles.txAmountText, { color: tx.color }]}>{tx.amount}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

function InsightsFlashcard({ color, tc, mode }: { color: string; tc: any; mode: string }) {
  const bars = [40, 75, 55, 95, 60, 85, 50];

  return (
    <View style={[visStyles.flashcardWrapper, { backgroundColor: tc.card, borderColor: `${color}40` }]}>
      <LinearGradient
        colors={mode === 'light' ? ['rgba(248,250,252,0.95)', '#FFFFFF'] : [`${color}20`, 'rgba(15,10,30,0.85)']}
        style={visStyles.flashcardGradient}
      >
        <View style={visStyles.cardTopRow}>
          <Text style={[visStyles.cardSubtitle, { color: tc.textMuted }]}>7-DAY OUTFLOW TREND</Text>
          <View style={visStyles.trendPill}>
            <Ionicons name="trending-down" size={12} color="#10B981" />
            <Text style={visStyles.trendPillText}>-14% vs last week</Text>
          </View>
        </View>

        {/* Mini Bars Chart */}
        <View style={visStyles.chartContainer}>
          {bars.map((h, i) => {
            const isPeak = h === 95;
            return (
              <View key={i} style={visStyles.barColumn}>
                <View style={[visStyles.barTrackBg, { backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}>
                  <LinearGradient
                    colors={isPeak ? ['#F59E0B', '#D97706'] : [color, `${color}88`]}
                    style={[visStyles.barFillLine, { height: `${h}%` }]}
                  />
                </View>
                <Text style={[visStyles.barDayLabel, { color: isPeak ? '#F59E0B' : tc.textMuted }]}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Top Category Badge */}
        <View style={[visStyles.topSpendCallout, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
          <View style={[visStyles.dotIndicator, { backgroundColor: color }]} />
          <Text style={[visStyles.topSpendText, { color: tc.textSecondary }]}>
            Top Driver: <Text style={{ fontWeight: '800', color: tc.textPrimary }}>Food & Dining</Text> (42% of total outflow)
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function BudgetFlashcard({ color, tc, mode }: { color: string; tc: any; mode: string }) {
  const budgetItems = [
    { name: 'Dining & Food', spent: 7200, limit: 10000, pct: 72, color: '#38BDF8' },
    { name: 'Shopping & Gear', spent: 9200, limit: 10000, pct: 92, color: '#F43F5E' },
  ];

  return (
    <View style={[visStyles.flashcardWrapper, { backgroundColor: tc.card, borderColor: `${color}40` }]}>
      <LinearGradient
        colors={mode === 'light' ? ['rgba(248,250,252,0.95)', '#FFFFFF'] : [`${color}20`, 'rgba(15,10,30,0.85)']}
        style={visStyles.flashcardGradient}
      >
        <View style={visStyles.cardTopRow}>
          <Text style={[visStyles.cardSubtitle, { color: tc.textMuted }]}>ACTIVE BUDGET TARGETS</Text>
          <View style={visStyles.alertBadge}>
            <Ionicons name="flame" size={12} color="#F59E0B" />
            <Text style={visStyles.alertBadgeText}>Live Alerts</Text>
          </View>
        </View>

        <View style={visStyles.budgetItemsStack}>
          {budgetItems.map((b, idx) => {
            const isDanger = b.pct >= 90;
            return (
              <View key={idx} style={[visStyles.budgetItemCard, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                <View style={visStyles.budgetTitleRow}>
                  <Text style={[visStyles.budgetNameText, { color: tc.textPrimary }]}>{b.name}</Text>
                  <Text style={[visStyles.budgetSpendRatio, { color: isDanger ? '#F43F5E' : tc.textSecondary }]}>
                    <Text style={{ fontWeight: '800' }}>₹{b.spent.toLocaleString()}</Text> / ₹{b.limit.toLocaleString()}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={[visStyles.progressTrackBg, { backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}>
                  <View
                    style={[
                      visStyles.progressFillBar,
                      {
                        width: `${b.pct}%`,
                        backgroundColor: isDanger ? '#F43F5E' : b.color,
                      },
                    ]}
                  />
                </View>

                <View style={visStyles.budgetFooterInfo}>
                  <Text style={[visStyles.burnRateText, { color: tc.textMuted }]}>
                    {isDanger ? '⚠️ Approaching limit' : '✅ ₹280/day safe pace'}
                  </Text>
                  <Text style={[visStyles.budgetPercentTag, { color: isDanger ? '#F43F5E' : b.color }]}>
                    {b.pct}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

function ReadyFlashcard({ color, tc, mode }: { color: string; tc: any; mode: string }) {
  const capabilities = [
    { icon: 'color-palette-outline', title: '5 Themes', sub: 'Dark & Light modes' },
    { icon: 'globe-outline', title: 'Currencies', sub: 'Global INR, USD, EUR' },
    { icon: 'download-outline', title: 'Export', sub: 'Instant CSV & PDF' },
    { icon: 'lock-closed-outline', title: 'Biometrics', sub: 'Local PIN & Lock' },
  ];

  return (
    <View style={[visStyles.flashcardWrapper, { backgroundColor: tc.card, borderColor: `${color}40` }]}>
      <LinearGradient
        colors={mode === 'light' ? ['rgba(248,250,252,0.95)', '#FFFFFF'] : [`${color}20`, 'rgba(15,10,30,0.85)']}
        style={visStyles.flashcardGradient}
      >
        <View style={visStyles.cardTopRow}>
          <Text style={[visStyles.cardSubtitle, { color: tc.textMuted }]}>FULL LUXURY TOOLKIT</Text>
          <View style={[visStyles.readyPill, { backgroundColor: `${color}20`, borderColor: color }]}>
            <Ionicons name="sparkles" size={11} color={color} />
            <Text style={[visStyles.readyPillText, { color }]}>Ready</Text>
          </View>
        </View>

        <View style={visStyles.toolkitGrid}>
          {capabilities.map((c, i) => (
            <View key={i} style={[visStyles.toolkitTile, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
              <View style={[visStyles.tileIconBg, { backgroundColor: `${color}18` }]}>
                <Ionicons name={c.icon as any} size={18} color={color} />
              </View>
              <Text style={[visStyles.tileTitle, { color: tc.textPrimary }]}>{c.title}</Text>
              <Text style={[visStyles.tileSub, { color: tc.textMuted }]}>{c.sub}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

function SlideVisual({ type, color, tc, mode }: { type: string; color: string; tc: any; mode: string }) {
  switch (type) {
    case 'welcome':      return <WelcomeFlashcard color={color} tc={tc} mode={mode} />;
    case 'transactions': return <TransactionsFlashcard color={color} tc={tc} mode={mode} />;
    case 'insights':     return <InsightsFlashcard color={color} tc={tc} mode={mode} />;
    case 'budget':       return <BudgetFlashcard color={color} tc={tc} mode={mode} />;
    case 'ready':        return <ReadyFlashcard color={color} tc={tc} mode={mode} />;
    default:             return null;
  }
}

// ─── Main Onboarding Screen Component ─────────────────────────────────────────

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);
  const { updateSettings } = useSettings();
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Entrance animations per slide
  const slideAnims = useRef(
    SLIDES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(24),
      scale: new Animated.Value(0.96),
    }))
  ).current;

  const animateSlideIn = useCallback((idx: number) => {
    slideAnims[idx].opacity.setValue(0);
    slideAnims[idx].translateY.setValue(24);
    slideAnims[idx].scale.setValue(0.96);

    Animated.parallel([
      Animated.timing(slideAnims[idx].opacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnims[idx].translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnims[idx].scale, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnims]);

  useEffect(() => {
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
  };

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingTop: topInset }]}>
      {/* ── Top Header with Brand and Skip CTA ── */}
      <View style={[styles.topHeader, { borderBottomColor: tc.cardBorder }]}>
        <View style={styles.topLogoRow}>
          <Image
            source={require('../../../../assets/icon.png')}
            style={styles.topLogoImg}
            resizeMode="contain"
          />
          <Text style={[styles.topLogoTitle, { color: tc.textPrimary }]}>Xpense</Text>
        </View>

        <TouchableOpacity
          onPress={handleGetStarted}
          activeOpacity={0.7}
          style={[styles.topSkipBtn, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
        >
          <Text style={[styles.topSkipText, { color: tc.textSecondary }]}>Skip Tour</Text>
          <Ionicons name="chevron-forward" size={13} color={tc.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Horizontal Swipable Slide Stream ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
          listener: onScroll,
        })}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <ScrollView
            key={s.id}
            contentContainerStyle={styles.slideScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.slideContent,
                {
                  opacity: slideAnims[i].opacity,
                  transform: [
                    { translateY: slideAnims[i].translateY },
                    { scale: slideAnims[i].scale },
                  ],
                },
              ]}
            >
              {/* Dynamic Accent Glow */}
              <View style={[styles.ambientGlow, { backgroundColor: s.accentGlow }]} />

              {/* Step / Category Pill */}
              <View style={[styles.badgePill, { backgroundColor: s.accentMuted, borderColor: `${s.accentColor}55` }]}>
                <Ionicons name={s.icon} size={13} color={s.accentColor} style={{ marginRight: 4 }} />
                <Text style={[styles.badgePillText, { color: s.accentColor }]}>{s.badge}</Text>
              </View>

              {/* Interactive Flashcard Visual Preview */}
              <SlideVisual type={s.visual} color={s.accentColor} tc={tc} mode={theme.mode} />

              {/* Title & Subtitle */}
              <View style={styles.textStack}>
                <Text style={[styles.slideTitle, { color: tc.textPrimary }]}>{s.title}</Text>
                <Text style={[styles.slideSubtitle, { color: tc.textSecondary }]}>{s.subtitle}</Text>
              </View>

              {/* Feature Benefit Points */}
              <View style={[styles.featureListCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                {s.features.map((feat, fi) => (
                  <View key={fi} style={styles.featureItemRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: `${s.accentColor}20` }]}>
                      <Ionicons name={feat.icon as any} size={13} color={s.accentColor} />
                    </View>
                    <Text style={[styles.featureItemText, { color: tc.textSecondary }]}>{feat.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        ))}
      </ScrollView>

      {/* ── Bottom Controls & Fluid Actions ── */}
      <View style={[styles.bottomBar, { backgroundColor: tc.surface, borderTopColor: tc.cardBorder, paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Pagination Dots & Counter */}
        <View style={styles.paginationRow}>
          <View style={styles.dotsContainer}>
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
                    styles.dotItem,
                    { backgroundColor: isActive ? s.accentColor : tc.cardBorder },
                    isActive && { width: 26 },
                  ]}
                />
              );
            })}
          </View>
          <Text style={[styles.stepCountText, { color: tc.textMuted }]}>
            Step {currentIndex + 1} of {SLIDES.length}
          </Text>
        </View>

        {/* Dual Actions CTA */}
        {isLast ? (
          <TouchableOpacity
            onPress={handleGetStarted}
            activeOpacity={0.88}
            style={styles.primaryLaunchBtn}
          >
            <LinearGradient
              colors={slide.accentGradient}
              style={styles.primaryLaunchGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryLaunchText}>Start Your Journey</Text>
              <Ionicons name="rocket" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={handleGetStarted}
              activeOpacity={0.7}
              style={[styles.skipTourBtn, { borderColor: tc.cardBorder }]}
            >
              <Text style={[styles.skipTourBtnText, { color: tc.textSecondary }]}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNext}
              activeOpacity={0.88}
              style={styles.nextStepBtn}
            >
              <LinearGradient
                colors={slide.accentGradient}
                style={styles.nextStepGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextStepText}>Continue</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Component Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  topLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topLogoImg: {
    width: 26,
    height: 26,
    borderRadius: 7,
  },
  topLogoTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  topSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  topSkipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  slideScrollContent: {
    width,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
  },
  slideContent: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    width: width * 0.9,
    height: 220,
    borderRadius: 110,
    alignSelf: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  textStack: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  featureListCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    padding: 12,
    gap: 8,
    borderWidth: 1,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureItemText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotItem: {
    height: 6,
    width: 7,
    borderRadius: 3,
  },
  stepCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skipTourBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipTourBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextStepBtn: {
    flex: 1,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  nextStepGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  nextStepText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  primaryLaunchBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  primaryLaunchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  primaryLaunchText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

// ─── Visual Flashcard Specific Styles ────────────────────────────────────────

const visStyles = StyleSheet.create({
  flashcardWrapper: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  flashcardGradient: {
    padding: 14,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  balanceBlock: {
    alignItems: 'center',
    gap: 2,
    marginVertical: 2,
  },
  balanceMain: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricSmallLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricDivider: {
    width: 1,
    height: 24,
  },

  // Transactions Flashcard
  quickAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickAddText: {
    fontSize: 10,
    fontWeight: '800',
  },
  txListContainer: {
    gap: 7,
  },
  txItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
  },
  txIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfoCol: {
    flex: 1,
    gap: 1,
  },
  txTitleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  txCategoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  txAmountText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Insights Flashcard
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  trendPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
    gap: 8,
    paddingHorizontal: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrackBg: {
    width: '100%',
    flex: 1,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillLine: {
    width: '100%',
    borderRadius: 4,
  },
  barDayLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  topSpendCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  topSpendText: {
    fontSize: 11,
    flex: 1,
  },

  // Budget Flashcard
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  budgetItemsStack: {
    gap: 8,
  },
  budgetItemCard: {
    padding: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetNameText: {
    fontSize: 12,
    fontWeight: '700',
  },
  budgetSpendRatio: {
    fontSize: 11,
  },
  progressTrackBg: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFillBar: {
    height: '100%',
    borderRadius: 2.5,
  },
  budgetFooterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  burnRateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  budgetPercentTag: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Toolkit Flashcard
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  readyPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  toolkitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  toolkitTile: {
    width: '48%',
    borderRadius: radius.md,
    padding: 9,
    borderWidth: 1,
    gap: 3,
    alignItems: 'flex-start',
  },
  tileIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  tileSub: {
    fontSize: 10,
    fontWeight: '500',
  },
});
