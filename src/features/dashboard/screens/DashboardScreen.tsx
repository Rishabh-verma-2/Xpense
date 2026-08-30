import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '@/core/theme';
import { getSafeTopInset } from '@/shared/utils/layoutUtils';
import { useTransactions } from '@/context/TransactionContext';
import { useSettings } from '@/context/SettingsContext';
import { useCategories } from '@/context/CategoryContext';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { useSavingsGoal } from '@/context/SavingsGoalContext';
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { formatTransactionDate, getMonthKey, getMonthLabel } from '@/shared/utils/dateUtils';
import { Transaction } from '@/shared/types/transaction.types';
import { EmptyState } from '@/shared/components/EmptyState';
import { hapticMedium, hapticLight } from '@/shared/utils/haptics';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const { transactions } = useTransactions();
  const { settings, updateSettings } = useSettings();
  const { categories, getById } = useCategories();
  const { unreadCount } = useNotifications();
  const { goal } = useSavingsGoal();

  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);

  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const onboardingFade = useRef(new Animated.Value(0)).current;
  const onboardingScale = useRef(new Animated.Value(0.92)).current;

  // Bar entrance anims (staggered per bar)
  const barAnims = useRef([...Array(7)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
      Animated.timing(contentFade, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // Staggered bar entrance
    Animated.stagger(
      60,
      barAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true })
      )
    ).start();

    // Pulse live dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (settings && !settings.onboardingCompleted) {
      setShowOnboardingModal(true);
      Animated.parallel([
        Animated.timing(onboardingFade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(onboardingScale, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
      ]).start();
    }
  }, [settings, onboardingFade, onboardingScale]);

  const handleFinishOnboarding = async () => {
    Animated.parallel([
      Animated.timing(onboardingFade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(onboardingScale, { toValue: 0.92, duration: 200, useNativeDriver: true }),
    ]).start(async () => {
      setShowOnboardingModal(false);
      await updateSettings({ onboardingCompleted: true });
    });
  };

  const currencySymbol = settings?.currencySymbol ?? '₹';
  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const currentMonthLabel = useMemo(() => getMonthLabel(currentMonthKey), [currentMonthKey]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const totalBalance = useMemo(() => {
    return transactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);
  }, [transactions]);

  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const currentMonthTxs = transactions.filter((t) => getMonthKey(t.date) === currentMonthKey);
    let inc = 0;
    let exp = 0;
    for (const t of currentMonthTxs) {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    }
    return { monthlyIncome: inc, monthlyExpense: exp };
  }, [transactions, currentMonthKey]);

  const savingsRate = useMemo(() => {
    if (monthlyIncome <= 0) return 0;
    const net = monthlyIncome - monthlyExpense;
    return Math.max(0, Math.round((net / monthlyIncome) * 100));
  }, [monthlyIncome, monthlyExpense]);

  const savingsStatus = useMemo(() => {
    if (savingsRate >= 40) return { label: 'Elite Saver', color: '#10B981', icon: 'shield-checkmark' };
    if (savingsRate >= 20) return { label: 'Healthy Pace', color: '#38BDF8', icon: 'sparkles' };
    if (savingsRate > 0) return { label: 'On Track', color: '#F59E0B', icon: 'trending-up' };
    return { label: 'Review Budget', color: '#F43F5E', icon: 'alert-circle' };
  }, [savingsRate]);

  const monthlyTxCount = useMemo(() => {
    return transactions.filter((t) => getMonthKey(t.date) === currentMonthKey).length;
  }, [transactions, currentMonthKey]);

  const netMonthlySavings = useMemo(() => monthlyIncome - monthlyExpense, [monthlyIncome, monthlyExpense]);

  // 7-Day Spending Sparkline
  const sparklineData = useMemo(() => {
    const days: { label: string; dateStr: string; amount: number }[] = [];
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const isoDatePrefix = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];
      const dayExpense = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(isoDatePrefix))
        .reduce((sum, t) => sum + t.amount, 0);
      days.push({ label: dayLabel, dateStr: isoDatePrefix, amount: dayExpense });
    }
    const maxDayAmount = Math.max(...days.map((d) => d.amount), 1);
    return { days, maxDayAmount };
  }, [transactions]);

  // Top Categories
  const topCategories = useMemo(() => {
    const catMap: Record<string, { name: string; icon: string; color: string; amount: number }> = {};
    const currentMonthTxs = transactions.filter(
      (t) => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey
    );
    for (const t of currentMonthTxs) {
      const cat = getById(t.categoryId);
      const catId = t.categoryId || 'other';
      const name = cat?.name || t.categoryNameSnapshot || 'Other';
      const icon = cat?.icon || t.categoryIconSnapshot || 'pricetag-outline';
      const color = cat?.color || t.categoryColorSnapshot || '#7C3AED';
      if (!catMap[catId]) {
        catMap[catId] = { name, icon, color, amount: 0 };
      }
      catMap[catId].amount += t.amount;
    }
    return Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 4);
  }, [transactions, currentMonthKey, getById]);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // Savings goal derived data
  const goalProgress = goal && goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
    : 0;
  const goalDaysLeft = goal
    ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000))
    : 0;

  const handleAddTransaction = (type?: 'expense' | 'income') => {
    hapticMedium();
    navigation.navigate('AddTransaction', { type });
  };

  const handleNavigateReports = () => navigation.navigate('ReportsTab');
  const handleNavigateHistory = () => navigation.navigate('HistoryTab');
  const handleNavigateSettings = () => navigation.navigate('SettingsTab');

  const userName = user?.name ? user.name : 'Financial Pilot';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'X';

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingTop: topInset }]}>

      {/* ── Sticky Header ── */}
      <Animated.View style={[styles.headerRow, { opacity: headerFade, backgroundColor: tc.background }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleNavigateSettings} activeOpacity={0.8}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={[styles.avatarImage, { borderColor: theme.accentColor }]} />
            ) : (
              <LinearGradient
                colors={theme.accentGradient}
                style={styles.avatarCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{userInitial}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
          <View>
            <Text style={[styles.greetingText, { color: tc.textMuted }]}>{greeting},</Text>
            <Text style={[styles.userNameText, { color: tc.textPrimary }]} numberOfLines={1}>
              {userName}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconCircleBtn, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
            onPress={() => navigation.navigate('SettingsTab', { screen: 'NotificationSettings' })}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color={tc.textSecondary} />
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: theme.accentColor }]} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Balance Card ── */}
        <Animated.View style={[styles.heroCardContainer, { transform: [{ scale: cardScale }] }]}>
          <LinearGradient
            colors={theme.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardGradient}
          >
            <View style={[styles.meshGlow1, { backgroundColor: theme.colors.mesh1 }]} />
            <View style={[styles.meshGlow2, { backgroundColor: theme.colors.mesh2 }]} />
            <View style={styles.specularTopLine} />

            {/* Card Header */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTagRow}>
                <Animated.View style={[styles.livePulseDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.cardSubTitle}>NET WORTH & BALANCE</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsBalanceHidden(!isBalanceHidden)}
                style={styles.eyeToggleBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isBalanceHidden ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#D8B4FE"
                />
              </TouchableOpacity>
            </View>

            {/* Balance */}
            <View style={styles.balanceRow}>
              <Text style={styles.balanceMainText}>
                {isBalanceHidden
                  ? `${currencySymbol} • • • • • •`
                  : formatCurrency(totalBalance, 'INR', currencySymbol)}
              </Text>
              <View style={[styles.monthBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={styles.monthBadgeText}>{currentMonthLabel}</Text>
              </View>
            </View>

            {/* Income / Expense Flow */}
            <View style={styles.flowRow}>
              <View style={styles.flowPill}>
                <View style={[styles.flowIconBg, { backgroundColor: theme.colors.incomeMuted }]}>
                  <Ionicons name="arrow-down" size={13} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.flowLabel}>Income</Text>
                  <Text style={styles.flowValueIncome}>
                    {isBalanceHidden ? `${currencySymbol} ••••` : `+${formatCurrency(monthlyIncome, 'INR', currencySymbol)}`}
                  </Text>
                </View>
              </View>

              <View style={styles.flowDivider} />

              <View style={styles.flowPill}>
                <View style={[styles.flowIconBg, { backgroundColor: theme.colors.expenseMuted }]}>
                  <Ionicons name="arrow-up" size={13} color="#F43F5E" />
                </View>
                <View>
                  <Text style={styles.flowLabel}>Spent</Text>
                  <Text style={styles.flowValueExpense}>
                    {isBalanceHidden ? `${currencySymbol} ••••` : `-${formatCurrency(monthlyExpense, 'INR', currencySymbol)}`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Savings Gauge Footer */}
            <View style={styles.cardFooterSection}>
              <View style={styles.savingsLabelRow}>
                <View style={styles.savingsStatusBadge}>
                  <Ionicons name={savingsStatus.icon as any} size={12} color={savingsStatus.color} />
                  <Text style={[styles.savingsStatusText, { color: savingsStatus.color }]}>
                    {savingsStatus.label}
                  </Text>
                </View>
                <Text style={styles.savingsRatePercent}>
                  {isBalanceHidden ? '• • %' : `${savingsRate}% Saved`}
                </Text>
              </View>
              <View style={styles.gaugeTrack}>
                <LinearGradient
                  colors={[theme.accentColor, tc.primaryLight || '#38BDF8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.gaugeFill, { width: `${Math.min(100, Math.max(3, savingsRate))}%` }]}
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Monthly Snapshot Strip ── */}
        <Animated.View style={[styles.snapshotStrip, { opacity: contentFade }]}>
          {/* Budget Used */}
          <View style={[styles.snapshotTile, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={[styles.snapshotIconBg, { backgroundColor: `${tc.expense}22` }]}>
              <Ionicons name="pie-chart-outline" size={16} color={tc.expense} />
            </View>
            <Text style={[styles.snapshotValue, { color: tc.textPrimary }]}>
              {monthlyIncome > 0 ? `${Math.min(100, Math.round((monthlyExpense / monthlyIncome) * 100))}%` : '—'}
            </Text>
            <Text style={[styles.snapshotLabel, { color: tc.textMuted }]}>Budget Used</Text>
          </View>

          {/* Net Savings */}
          <View style={[styles.snapshotTile, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={[styles.snapshotIconBg, { backgroundColor: `${tc.income}22` }]}>
              <Ionicons name="trending-up-outline" size={16} color={tc.income} />
            </View>
            <Text
              style={[
                styles.snapshotValue,
                { color: netMonthlySavings >= 0 ? tc.income : tc.expense },
              ]}
              numberOfLines={1}
            >
              {isBalanceHidden
                ? '••••'
                : formatCurrency(Math.abs(netMonthlySavings), 'INR', currencySymbol)}
            </Text>
            <Text style={[styles.snapshotLabel, { color: tc.textMuted }]}>
              {netMonthlySavings >= 0 ? 'Net Saved' : 'Overspent'}
            </Text>
          </View>

          {/* Tx Count */}
          <View style={[styles.snapshotTile, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={[styles.snapshotIconBg, { backgroundColor: `${theme.accentColor}22` }]}>
              <Ionicons name="receipt-outline" size={16} color={theme.accentColor} />
            </View>
            <Text style={[styles.snapshotValue, { color: tc.textPrimary }]}>{monthlyTxCount}</Text>
            <Text style={[styles.snapshotLabel, { color: tc.textMuted }]}>This Month</Text>
          </View>
        </Animated.View>

        {/* ── Quick Actions ── */}
        <Animated.View style={[styles.quickActionsContainer, { opacity: contentFade }]}>
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => handleAddTransaction('expense')}
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={['rgba(244, 63, 94, 0.22)', 'rgba(225, 29, 72, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.quickActionGradient, { borderColor: 'rgba(244,63,94,0.2)' }]}
            >
              <View style={[styles.quickActionIconCircle, { backgroundColor: tc.expense }]}>
                <Ionicons name="arrow-up" size={17} color="#FFF" />
              </View>
              <View style={styles.quickActionTextCol}>
                <Text style={[styles.quickActionHeading, { color: tc.textPrimary }]}>Add Expense</Text>
                <Text style={[styles.quickActionSub, { color: tc.textMuted }]}>Quick Outflow</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => handleAddTransaction('income')}
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.22)', 'rgba(5, 150, 105, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.quickActionGradient, { borderColor: 'rgba(16,185,129,0.2)' }]}
            >
              <View style={[styles.quickActionIconCircle, { backgroundColor: tc.income }]}>
                <Ionicons name="arrow-down" size={17} color="#FFF" />
              </View>
              <View style={styles.quickActionTextCol}>
                <Text style={[styles.quickActionHeading, { color: tc.textPrimary }]}>Add Income</Text>
                <Text style={[styles.quickActionSub, { color: tc.textMuted }]}>Quick Inflow</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── 7-Day Sparkline ── */}
        <Animated.View
          style={[styles.sparklineCard, { backgroundColor: tc.card, borderColor: tc.cardBorder, opacity: contentFade }]}
        >
          <View style={styles.sparklineHeader}>
            <View>
              <Text style={[styles.sectionHeaderTitle, { color: tc.textPrimary }]}>Last 7 Days Outflow</Text>
              <Text style={[styles.sectionHeaderSub, { color: tc.textMuted }]}>Daily activity breakdown</Text>
            </View>
            <TouchableOpacity
              onPress={handleNavigateReports}
              style={[styles.sparklineBadge, { backgroundColor: tc.primaryMuted, borderColor: `${theme.accentColor}4D` }]}
            >
              <Text style={[styles.sparklineBadgeText, { color: theme.accentColor }]}>View Trends</Text>
              <Ionicons name="chevron-forward" size={12} color={theme.accentColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.barsRow}>
            {sparklineData.days.map((day, idx) => {
              const heightPercent = Math.max(12, Math.round((day.amount / sparklineData.maxDayAmount) * 100));
              const isPeak = day.amount === sparklineData.maxDayAmount && day.amount > 0;
              const barAnim = barAnims[idx];

              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.barColumn,
                    {
                      opacity: barAnim,
                      transform: [{ scaleY: barAnim }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' },
                    ]}
                  >
                    <LinearGradient
                      colors={isPeak ? ['#F59E0B', '#D97706'] : [theme.accentColor, tc.primaryDark]}
                      style={[styles.barFill, { height: `${heightPercent}%` }]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: isPeak ? '#F59E0B' : tc.textMuted }]}>
                    {day.label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Top Spending Categories ── */}
        {topCategories.length > 0 && (
          <Animated.View style={[styles.categorySection, { opacity: contentFade }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitleText, { color: tc.textPrimary }]}>Top Spends This Month</Text>
              <TouchableOpacity onPress={handleNavigateReports}>
                <Text style={[styles.seeAllText, { color: theme.accentColor }]}>Analysis</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryGrid}>
              {topCategories.map((cat, idx) => {
                const percentOfTotal =
                  monthlyExpense > 0 ? Math.round((cat.amount / monthlyExpense) * 100) : 0;
                return (
                  <View
                    key={idx}
                    style={[styles.categoryCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
                  >
                    <View style={styles.categoryCardTop}>
                      <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}22` }]}>
                        <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                      </View>
                      <Text style={[styles.categoryPercentText, { color: tc.textMuted }]}>{percentOfTotal}%</Text>
                    </View>
                    <Text style={[styles.categoryNameText, { color: tc.textPrimary }]} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    <Text style={[styles.categoryAmountText, { color: tc.textPrimary }]}>
                      {formatCurrency(cat.amount, 'INR', currencySymbol)}
                    </Text>
                    <View
                      style={[
                        styles.categoryProgressTrack,
                        {
                          backgroundColor:
                            theme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryProgressFill,
                          { width: `${Math.min(100, percentOfTotal)}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── Smart Savings Goal Widget ── */}
        <Animated.View style={[{ opacity: contentFade }, styles.savingsGoalSection]}>
          {goal ? (
            /* Active goal card */
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate('SettingsTab', { screen: 'SavingsGoal' })}
            >
              <LinearGradient
                colors={theme.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goalWidget}
              >
                <View style={[styles.meshGlow1, { backgroundColor: theme.colors.mesh1, opacity: 0.5 }]} />
                <View style={styles.goalWidgetTop}>
                  <View style={styles.goalWidgetLeft}>
                    <Text style={styles.goalWidgetEmoji}>{goal.emoji}</Text>
                    <View>
                      <Text style={styles.goalWidgetLabel}>SAVINGS GOAL</Text>
                      <Text style={styles.goalWidgetName} numberOfLines={1}>{goal.name}</Text>
                    </View>
                  </View>
                  <View style={styles.goalWidgetRight}>
                    <Text style={styles.goalWidgetPercent}>{goalProgress}%</Text>
                    {goal.achieved && (
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    )}
                  </View>
                </View>

                <View style={styles.goalAmountsRow}>
                  <Text style={styles.goalSavedText}>
                    {formatCurrency(goal.savedAmount, 'INR', currencySymbol)}
                  </Text>
                  <Text style={styles.goalTargetText}>
                    / {formatCurrency(goal.targetAmount, 'INR', currencySymbol)}
                  </Text>
                </View>

                <View style={styles.goalProgressTrack}>
                  <LinearGradient
                    colors={goal.achieved ? ['#10B981', '#34D399'] : [theme.accentColor, tc.primaryLight || theme.accentColor]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.goalProgressFill, { width: `${Math.max(3, goalProgress)}%` }]}
                  />
                </View>

                <View style={styles.goalFooterRow}>
                  <Text style={styles.goalDaysText}>
                    {goal.achieved ? '🎉 Achieved!' : `⏰ ${goalDaysLeft} days left`}
                  </Text>
                  <View style={styles.goalEditBtn}>
                    <Text style={styles.goalEditBtnText}>Update →</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            /* CTA to create goal */
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => navigation.navigate('SettingsTab', { screen: 'SavingsGoal' })}
              style={[styles.goalCtaCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
            >
              <LinearGradient
                colors={[`${theme.accentColor}22`, `${theme.accentColor}08`]}
                style={styles.goalCtaInner}
              >
                <View style={[styles.goalCtaIconBg, { backgroundColor: `${theme.accentColor}22` }]}>
                  <Ionicons name="flag-outline" size={22} color={theme.accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalCtaTitle, { color: tc.textPrimary }]}>Set a Savings Goal</Text>
                  <Text style={[styles.goalCtaSub, { color: tc.textMuted }]}>
                    Track your journey to financial milestones
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.accentColor} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ── Recent Transactions ── */}
        <Animated.View style={[styles.recentSection, { opacity: contentFade }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitleText, { color: tc.textPrimary }]}>Recent Transactions</Text>
            {transactions.length > 0 && (
              <TouchableOpacity onPress={handleNavigateHistory} activeOpacity={0.7}>
                <Text style={[styles.seeAllText, { color: theme.accentColor }]}>
                  View All ({transactions.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length > 0 ? (
            <View style={styles.txListContainer}>
              {recentTransactions.map((tx, index) => {
                const isIncome = tx.type === 'income';
                const cat = getById(tx.categoryId);
                const catName = cat?.name || tx.categoryNameSnapshot || 'General';
                const catIcon = cat?.icon || tx.categoryIconSnapshot || 'receipt-outline';
                const catColor = cat?.color || tx.categoryColorSnapshot || tc.primary;
                const method = (tx.paymentMethod || 'cash').toUpperCase();

                return (
                  <TouchableOpacity
                    key={tx.id || index}
                    style={[styles.txCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
                    onPress={handleNavigateHistory}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.txIconContainer, { backgroundColor: `${catColor}1A` }]}>
                      <Ionicons name={catIcon as any} size={20} color={catColor} />
                    </View>

                    <View style={styles.txDetailsCol}>
                      <Text style={[styles.txCategoryTitle, { color: tc.textPrimary }]} numberOfLines={1}>
                        {catName}
                      </Text>
                      <View style={styles.txMetaRow}>
                        <View
                          style={[
                            styles.paymentMethodBadge,
                            { backgroundColor: tc.surface, borderColor: tc.cardBorder },
                          ]}
                        >
                          <Text style={[styles.paymentMethodText, { color: tc.textMuted }]}>{method}</Text>
                        </View>
                        <Text style={[styles.txTimeText, { color: tc.textMuted }]}>
                          {formatTransactionDate(tx.date)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txAmountCol}>
                      <Text
                        style={[
                          styles.txAmountValue,
                          { color: isIncome ? tc.income : tc.expense },
                        ]}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, 'INR', currencySymbol)}
                      </Text>
                      {tx.notes ? (
                        <Text style={[styles.txNotesSnippet, { color: tc.textMuted }]} numberOfLines={1}>
                          {tx.notes}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                subtitle="Start tracking by adding your first income or expense transaction."
                actionLabel="+ Add Transaction"
                onAction={() => handleAddTransaction()}
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Onboarding Modal ── */}
      <Modal
        visible={showOnboardingModal}
        transparent
        animationType="fade"
        onRequestClose={handleFinishOnboarding}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: onboardingFade }]}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: onboardingScale }] }]}>
            <LinearGradient colors={['#2D1B69', '#1A0A4A', '#0F0728']} style={styles.modalHeaderGrad}>
              <View style={styles.modalBadge}>
                <Ionicons name="sparkles" size={24} color="#C084FC" />
              </View>
              <Text style={styles.modalTitle}>Welcome to Xpense! 🚀</Text>
              <Text style={styles.modalSubtitle}>Here is your starter guide to mastering your wealth:</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              {[
                { icon: 'wallet-outline', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)', title: 'Log Transactions', desc: 'Fast & intuitive income & expense logging.' },
                { icon: 'pie-chart-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', title: 'Category Budgets', desc: 'Set limits and get proactive warning alerts.' },
                { icon: 'stats-chart-outline', color: '#10B981', bg: 'rgba(16,185,129,0.15)', title: 'Financial Reports', desc: 'Visual trends & one-tap PDF statements.' },
                { icon: 'flag-outline', color: '#38BDF8', bg: 'rgba(56,189,248,0.15)', title: 'Savings Goals', desc: 'Track milestones with a live progress widget.' },
              ].map((f, i) => (
                <View key={i} style={styles.onboardingFeatureRow}>
                  <View style={[styles.onboardingIconBg, { backgroundColor: f.bg }]}>
                    <Ionicons name={f.icon as any} size={20} color={f.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.onboardingFeatureTitle}>{f.title}</Text>
                    <Text style={styles.onboardingFeatureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.modalButton} onPress={handleFinishOnboarding} activeOpacity={0.88}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.modalButtonGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalButtonText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  // Hero Card
  heroCardContainer: {
    marginTop: 6,
    marginBottom: 14,
  },
  heroCardGradient: {
    borderRadius: 26,
    padding: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  meshGlow1: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  meshGlow2: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  specularTopLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  cardSubTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#D8B4FE',
  },
  eyeToggleBtn: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
  },
  balanceRow: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  balanceMainText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(168, 85, 247, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  monthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  flowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  flowIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  flowValueIncome: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
  },
  flowValueExpense: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FB7185',
  },
  flowDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  cardFooterSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  savingsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  savingsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  savingsStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  savingsRatePercent: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  gaugeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Monthly Snapshot Strip
  snapshotStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  snapshotTile: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  snapshotIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  snapshotValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  snapshotLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  quickActionTile: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  quickActionTextCol: { flex: 1 },
  quickActionHeading: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  quickActionSub: {
    fontSize: 10,
    marginTop: 1,
    fontWeight: '600',
  },

  // Sparkline
  sparklineCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sparklineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionHeaderSub: {
    fontSize: 11,
    marginTop: 1,
  },
  sparklineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  sparklineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    paddingTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    transformOrigin: 'bottom',
  },
  barTrack: {
    width: 8,
    height: 48,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 6,
    fontWeight: '600',
  },

  // Categories
  categorySection: { marginBottom: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  categoryCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  categoryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPercentText: {
    fontSize: 11,
    fontWeight: '800',
  },
  categoryNameText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryAmountText: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  categoryProgressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Savings Goal Widget
  savingsGoalSection: {
    marginBottom: 16,
  },
  goalWidget: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  goalWidgetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  goalWidgetEmoji: { fontSize: 24 },
  goalWidgetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  goalWidgetName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  goalWidgetRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  goalWidgetPercent: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  goalAmountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 10,
  },
  goalSavedText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  goalTargetText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  goalProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalDaysText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
  },
  goalEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  goalEditBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  goalCtaCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  goalCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  goalCtaIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCtaTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  goalCtaSub: {
    fontSize: 11,
    marginTop: 2,
  },

  // Transactions
  recentSection: { marginBottom: 20 },
  txListContainer: { gap: 8 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  txIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDetailsCol: { flex: 1 },
  txCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMethodBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  paymentMethodText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  txTimeText: { fontSize: 11 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmountValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  txNotesSnippet: {
    fontSize: 10,
    marginTop: 2,
    maxWidth: 90,
  },
  emptyContainer: { paddingVertical: 16 },

  // Onboarding Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#131024',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 24,
  },
  modalHeaderGrad: {
    padding: 24,
    alignItems: 'center',
  },
  modalBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalBody: {
    padding: 20,
    gap: 14,
  },
  onboardingFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onboardingIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingFeatureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onboardingFeatureDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  modalButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalButtonGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
