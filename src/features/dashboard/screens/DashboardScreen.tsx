import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '@/core/theme';
import { useTransactions } from '@/context/TransactionContext';
import { useSettings } from '@/context/SettingsContext';
import { useCategories } from '@/context/CategoryContext';
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
  categoryIcon: string;
  categoryColor: string;
  onPress: () => void;
}

function TransactionRow({
  item,
  index,
  currencySymbol,
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
            {item.notes?.trim() ? item.notes : item.categoryNameSnapshot}
          </Text>
          <Text style={styles.txCategory}>{item.categoryNameSnapshot}</Text>
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
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const { getById } = useCategories();

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

  const handleAddTransaction = (type?: 'expense' | 'income') => {
    navigation.navigate('AddTransaction', { type });
  };

  const handleSeeAll = () => {
    navigation.navigate('HistoryTab');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>Dashboard</Text>
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

            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(totalBalance, 'INR', currencySymbol)}
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
                    categoryIcon={category?.icon || item.categoryIconSnapshot}
                    categoryColor={category?.color || item.categoryColorSnapshot}
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

      {/* ── Floating Action Button (FAB) ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => handleAddTransaction()}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
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
});
