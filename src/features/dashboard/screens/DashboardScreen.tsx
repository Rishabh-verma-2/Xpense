import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
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
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { formatTransactionDate, getMonthKey, getMonthLabel } from '@/shared/utils/dateUtils';
import { Transaction } from '@/shared/types/transaction.types';
import { EmptyState } from '@/shared/components/EmptyState';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  amount: number;
  currencySymbol: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  delay: number;
}

function StatCard({ label, amount, currencySymbol, icon, iconBg, iconColor }: StatCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isExpense = label === 'Expenses';

  return (
    <Animated.View
      style={[
        styles.statCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.statIconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statAmount,
          { color: isExpense ? colors.expense : colors.income },
        ]}
      >
        {isExpense ? '-' : '+'}{formatCurrency(amount, 'INR', currencySymbol)}
      </Text>
    </Animated.View>
  );
}

interface TransactionRowProps {
  item: Transaction;
  index: number;
  currencySymbol: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  onPress: () => void;
}

function TransactionRow({
  item,
  index,
  currencySymbol,
  categoryName,
  categoryIcon,
  categoryColor,
  onPress,
}: TransactionRowProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isIncome = item.type === 'income';

  return (
    <Animated.View
      style={[
        styles.txRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.txRowTouch}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.txIconBg,
            { backgroundColor: isIncome ? colors.incomeMuted : colors.expenseMuted },
          ]}
        >
          <Ionicons
            name={(categoryIcon as any) || (isIncome ? 'wallet-outline' : 'receipt-outline')}
            size={18}
            color={categoryColor || (isIncome ? colors.income : colors.expense)}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {categoryName}
          </Text>
          <Text style={styles.txCategory}>{item.notes?.trim() ? item.notes : categoryName}</Text>
        </View>
        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              { color: isIncome ? colors.income : colors.expense },
            ]}
          >
            {isIncome ? '+' : '-'}{formatCurrency(item.amount, 'INR', currencySymbol)}
          </Text>
          <Text style={styles.txDate}>{formatTransactionDate(item.date)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { settings, updateSettings } = useSettings();
  const { getById } = useCategories();

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const onboardingFade = useRef(new Animated.Value(0)).current;
  const onboardingScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (settings && !settings.onboardingCompleted) {
      setShowOnboardingModal(true);
      Animated.parallel([
        Animated.timing(onboardingFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(onboardingScale, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [settings, onboardingFade, onboardingScale]);

  const handleFinishOnboarding = async () => {
    Animated.parallel([
      Animated.timing(onboardingFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(onboardingScale, {
        toValue: 0.92,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setShowOnboardingModal(false);
      await updateSettings({ onboardingCompleted: true });
    });
  };

  const currencySymbol = settings?.currencySymbol ?? '₹';
  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const currentMonthLabel = useMemo(() => getMonthLabel(currentMonthKey), [currentMonthKey]);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 18) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  }, []);

  // Compute live financial totals
  const totalExpenses = useMemo(() => {
    return transactions.reduce((sum, t) => {
      return t.type === 'expense' ? sum + t.amount : sum;
    }, 0);
  }, [transactions]);

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

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const headerFade = useRef(new Animated.Value(0)).current;
  const balanceFade = useRef(new Animated.Value(0)).current;
  const balanceSlide = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(balanceFade, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(balanceSlide, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [headerFade, balanceFade, balanceSlide]);

  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);

  const handleAddTransaction = (type?: 'expense' | 'income') => {
    navigation.navigate('AddTransaction', { type });
  };

  const handleSeeAll = () => {
    navigation.navigate('HistoryTab');
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{user?.name ? user.name : 'Welcome Back'}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtnHeader}
            onPress={() => handleAddTransaction()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.addBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={24} color={colors.textOnPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Balance Card ── */}
        <Animated.View
          style={[styles.balanceCard, { opacity: balanceFade, transform: [{ translateY: balanceSlide }] }]}
        >
          <LinearGradient
            colors={['#2D1B69', '#1A0A4A', '#0A0A0F']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            <Text style={styles.balanceLabel}>TOTAL EXPENSES</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(totalExpenses, 'INR', currencySymbol)}
            </Text>
            <Text style={styles.balancePeriod}>{currentMonthLabel}</Text>

            {/* Savings Bar */}
            <View style={styles.savingsSection}>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>Savings Rate</Text>
                <Text style={styles.savingsValue}>{savingsRate}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, savingsRate)}%` }]} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Quick Action Buttons for Instant Entry ── */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => handleAddTransaction('expense')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.quickActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.quickActionIconBg}>
                <Ionicons name="arrow-down" size={16} color="#FFF" />
              </View>
              <Text style={styles.quickActionText}>+ Expense</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => handleAddTransaction('income')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.quickActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.quickActionIconBg}>
                <Ionicons name="arrow-up" size={16} color="#FFF" />
              </View>
              <Text style={styles.quickActionText}>+ Income</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Stat Cards ── */}
        <View style={styles.statRow}>
          <StatCard
            label="Income"
            amount={monthlyIncome}
            currencySymbol={currencySymbol}
            icon="trending-up-outline"
            iconBg={colors.incomeMuted}
            iconColor={colors.income}
            delay={150}
          />
          <StatCard
            label="Expenses"
            amount={monthlyExpense}
            currencySymbol={currencySymbol}
            icon="trending-down-outline"
            iconBg={colors.expenseMuted}
            iconColor={colors.expense}
            delay={200}
          />
        </View>

        {/* ── Recent Transactions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length > 0 && (
              <TouchableOpacity onPress={handleSeeAll} activeOpacity={0.7}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length > 0 ? (
            <View style={styles.txList}>
              {recentTransactions.map((item, index) => {
                const category = getById(item.categoryId);
                return (
                  <TransactionRow
                    key={item.id}
                    item={item}
                    index={index}
                    currencySymbol={currencySymbol}
                    categoryName={category?.name || item.categoryNameSnapshot || 'General'}
                    categoryIcon={category?.icon || item.categoryIconSnapshot || 'pricetag-outline'}
                    categoryColor={category?.color || item.categoryColorSnapshot || '#7C3AED'}
                    onPress={handleSeeAll}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                subtitle="Start tracking your expenses and income by adding your first transaction."
                actionLabel="+ Add Transaction"
                onAction={() => handleAddTransaction()}
              />
            </View>
          )}
        </View>

        {/* ── Insights / Savings Nudge ── */}
        {monthlyIncome > 0 && (
          <View style={styles.nudgeCard}>
            <View style={styles.nudgeIconWrap}>
              <Ionicons name="bulb-outline" size={22} color={colors.savings} />
            </View>
            <View style={styles.nudgeText}>
              <Text style={styles.nudgeTitle}>
                {savingsRate >= 20 ? "You're on track! 🎉" : 'Monthly Overview'}
              </Text>
              <Text style={styles.nudgeBody}>
                You've saved {savingsRate}% of your income in {currentMonthLabel}.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── New User Onboarding Modal ── */}
      <Modal
        visible={showOnboardingModal}
        transparent
        animationType="fade"
        onRequestClose={handleFinishOnboarding}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: onboardingFade }]}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: onboardingScale }] }]}>
            <LinearGradient
              colors={['#2D1B69', '#1A0A4A', '#0F0728']}
              style={styles.modalHeaderGrad}
            >
              <View style={styles.modalBadge}>
                <Ionicons name="sparkles" size={24} color="#C084FC" />
              </View>
              <Text style={styles.modalTitle}>Welcome to Xpense! 🚀</Text>
              <Text style={styles.modalSubtitle}>
                Here is your quick starter guide to master your money:
              </Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.onboardingFeatureRow}>
                <View style={[styles.onboardingIconBg, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
                  <Ionicons name="wallet-outline" size={22} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.onboardingFeatureTitle}>Log Transactions</Text>
                  <Text style={styles.onboardingFeatureDesc}>Quickly record income & expenses with smart auto-categorisation.</Text>
                </View>
              </View>

              <View style={styles.onboardingFeatureRow}>
                <View style={[styles.onboardingIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="pie-chart-outline" size={22} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.onboardingFeatureTitle}>Set Category Budgets</Text>
                  <Text style={styles.onboardingFeatureDesc}>Set monthly spending limits and get alerts before overspending.</Text>
                </View>
              </View>

              <View style={styles.onboardingFeatureRow}>
                <View style={[styles.onboardingIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="stats-chart-outline" size={22} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.onboardingFeatureTitle}>Track Insights & Export</Text>
                  <Text style={styles.onboardingFeatureDesc}>Analyse spending trends and export PDF & CSV reports anytime.</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={handleFinishOnboarding}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#7C3AED', '#5B21B6']}
                  style={styles.modalActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalActionText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  userName: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: 2,
  },
  addBtnHeader: {
    borderRadius: radius.full,
  },
  addBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  balanceGradient: {
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    bottom: -30,
    left: 20,
  },
  balanceLabel: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginTop: spacing.xs,
  },
  balancePeriod: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  savingsSection: {
    marginTop: spacing.lg,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  savingsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  savingsValue: {
    ...typography.caption,
    color: colors.savings,
    fontWeight: '700' as const,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.savings,
    borderRadius: radius.full,
  },

  // Stat Cards
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statAmount: {
    ...typography.subheading,
    marginTop: spacing.xs,
  },

  // Section
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.bodyMedium,
    color: colors.primaryLight,
  },

  // Transaction List
  txList: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  txRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  txRowTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  txIconBg: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  txInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  txTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  txCategory: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...typography.bodyMedium,
  },
  txDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.xl,
  },

  // Nudge card
  nudgeCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.savingsMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  nudgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeText: {
    flex: 1,
  },
  nudgeTitle: {
    ...typography.bodyMedium,
    color: colors.savings,
  },
  nudgeBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  // Quick Action Buttons
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    borderRadius: radius.lg,
  },
  quickActionIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },

  // Floating Action Button (FAB)
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Onboarding Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 24,
  },
  modalHeaderGrad: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalBadge: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.body,
    color: 'rgba(216, 180, 254, 0.85)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  onboardingFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  onboardingIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingFeatureTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  onboardingFeatureDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  modalActionBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  modalActionGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.full,
  },
  modalActionText: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
