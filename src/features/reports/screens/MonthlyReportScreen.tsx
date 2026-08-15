import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReportsStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';
import { getMonthKey, shiftMonth, getMonthLabel } from '../../../shared/utils/dateUtils';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { MonthSelector } from '../../../shared/components/MonthSelector';
import { computeMonthlyStats } from '../services/reportEngine';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { ExportModal } from '../../../shared/components/ExportModal';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<ReportsStackParamList, 'MonthlyReport'>;
};

export default function MonthlyReportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);
  const [monthKey, setMonthKey] = useState(getMonthKey(new Date()));
  const [showExportModal, setShowExportModal] = useState(false);
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const prevMonthKey = shiftMonth(monthKey, -1);

  const prevMonthTxs = useMemo(() => {
    return transactions.filter((t) => getMonthKey(t.date) === prevMonthKey);
  }, [transactions, prevMonthKey]);

  const stats = useMemo(() => {
    return computeMonthlyStats(transactions, monthKey, prevMonthTxs);
  }, [transactions, monthKey, prevMonthTxs]);

  // Compute MoM Change
  const momExpenseChange = useMemo(() => {
    const currExp = stats.totalExpense;
    const prevExp = prevMonthTxs
      .filter((t) => t.type === 'expense' && !t.deletedAt)
      .reduce((s, t) => s + t.amount, 0);

    if (prevExp === 0) return null;
    const diff = ((currExp - prevExp) / prevExp) * 100;
    return {
      percentage: Math.abs(Math.round(diff)),
      isIncreased: diff > 0,
      diffAmount: currExp - prevExp,
    };
  }, [stats.totalExpense, prevMonthTxs]);

  // Compute Daily Average Burn
  const dailyAverage = useMemo(() => {
    const [y, m] = monthKey.split('-').map(Number);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
    const daysPassed = isCurrentMonth ? now.getDate() : new Date(y, m, 0).getDate();
    return daysPassed > 0 ? Math.round(stats.totalExpense / daysPassed) : 0;
  }, [monthKey, stats.totalExpense]);

  // Compute Peak Spending Day
  const peakDay = useMemo(() => {
    if (!stats.dailyTrend || stats.dailyTrend.length === 0) return null;
    let maxItem = stats.dailyTrend[0];
    for (const item of stats.dailyTrend) {
      if (item.amount > maxItem.amount) maxItem = item;
    }
    return maxItem.amount > 0 ? maxItem : null;
  }, [stats.dailyTrend]);

  const pieData = useMemo(() => {
    return stats.categoryBreakdown.map((item) => ({
      value: item.amount,
      color: item.categoryColor,
      text: `${item.percentage.toFixed(0)}%`,
    }));
  }, [stats.categoryBreakdown]);

  const barData = useMemo(() => {
    return stats.dailyTrend.map((item) => {
      const isPeak = peakDay && item.date === peakDay.date;
      return {
        value: item.amount,
        label: item.date.slice(8), // Day number
        frontColor: isPeak ? '#F59E0B' : '#7C3AED',
      };
    });
  }, [stats.dailyTrend, peakDay]);

  const topCategory = stats.categoryBreakdown[0] ?? null;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analytics & Reports</Text>
          <Text style={styles.headerSubtitle}>{getMonthLabel(monthKey)}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => setShowExportModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.25)', 'rgba(124, 58, 237, 0.12)']}
              style={styles.exportGradient}
            >
              <Ionicons name="download-outline" size={16} color={colors.primaryLight} />
              <Text style={styles.exportText}>Export</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.yearlyToggleBtn}
            onPress={() => navigation.navigate('YearlyReport', { year: monthKey.slice(0, 4) })}
            activeOpacity={0.8}
          >
            <Text style={styles.yearlyToggleText}>Yearly</Text>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Picker Selector */}
      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Glassmorphic Hero Overview Card ── */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#1F1147', '#120831', '#0A051D']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.decorRing1} />
            <View style={styles.decorRing2} />

            {/* Top row: Label & MoM Pill */}
            <View style={styles.heroHeaderRow}>
              <Text style={styles.heroLabel}>TOTAL SPENT</Text>

              {momExpenseChange ? (
                <View
                  style={[
                    styles.momPill,
                    {
                      backgroundColor: momExpenseChange.isIncreased
                        ? 'rgba(239, 68, 68, 0.18)'
                        : 'rgba(16, 185, 129, 0.18)',
                      borderColor: momExpenseChange.isIncreased
                        ? 'rgba(239, 68, 68, 0.35)'
                        : 'rgba(16, 185, 129, 0.35)',
                    },
                  ]}
                >
                  <Ionicons
                    name={momExpenseChange.isIncreased ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={momExpenseChange.isIncreased ? '#EF4444' : '#10B981'}
                  />
                  <Text
                    style={[
                      styles.momPillText,
                      { color: momExpenseChange.isIncreased ? '#EF4444' : '#10B981' },
                    ]}
                  >
                    {momExpenseChange.percentage}% {momExpenseChange.isIncreased ? 'more' : 'less'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Main Total Expense Value */}
            <Text style={styles.heroAmount}>
              {formatCurrency(stats.totalExpense, 'INR', currencySymbol)}
            </Text>

            {/* Sub Metrics Grid */}
            <View style={styles.heroGrid}>
              <View style={styles.heroMetricItem}>
                <Text style={styles.metricLabel}>Income</Text>
                <Text style={[styles.metricVal, { color: colors.income }]}>
                  {formatCurrency(stats.totalIncome, 'INR', currencySymbol)}
                </Text>
              </View>

              <View style={styles.gridDivider} />

              <View style={styles.heroMetricItem}>
                <Text style={styles.metricLabel}>Net Cashflow</Text>
                <Text
                  style={[
                    styles.metricVal,
                    { color: stats.netBalance >= 0 ? colors.income : colors.expense },
                  ]}
                >
                  {formatCurrency(stats.netBalance, 'INR', currencySymbol)}
                </Text>
              </View>

              <View style={styles.gridDivider} />

              <View style={styles.heroMetricItem}>
                <Text style={styles.metricLabel}>Avg / Day</Text>
                <Text style={[styles.metricVal, { color: colors.primaryLight }]}>
                  {formatCurrency(dailyAverage, 'INR', currencySymbol)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Category Breakdown Ring & Progress Bars ── */}
        {stats.categoryBreakdown.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleRow}>
                <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Ionicons name="pie-chart-outline" size={18} color="#C084FC" />
                </View>
                <Text style={styles.cardTitle}>Spending by Category</Text>
              </View>
              <Text style={styles.cardSubtitleCount}>
                {stats.categoryBreakdown.length} Categories
              </Text>
            </View>

            {/* Donut Chart */}
            <View style={styles.pieWrapper}>
              <PieChart
                data={pieData}
                donut
                radius={82}
                innerRadius={58}
                innerCircleColor={colors.surface}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: 11 }}>
                      Spent
                    </Text>
                    <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '700' }}>
                      {formatCurrency(stats.totalExpense, 'INR', currencySymbol)}
                    </Text>
                  </View>
                )}
              />
            </View>

            {/* Category Rows with Progress Bars */}
            <View style={styles.catList}>
              {stats.categoryBreakdown.map((item) => (
                <TouchableOpacity
                  key={item.categoryId}
                  style={styles.catCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('CategoryDrilldown', {
                      categoryId: item.categoryId,
                      monthKey,
                    })
                  }
                >
                  <View style={styles.catCardTop}>
                    <View style={styles.catCardLeft}>
                      <View
                        style={[
                          styles.catIconBg,
                          { backgroundColor: `${item.categoryColor}22` },
                        ]}
                      >
                        <Ionicons
                          name={item.categoryIcon as any}
                          size={18}
                          color={item.categoryColor}
                        />
                      </View>
                      <Text style={styles.catName}>{item.categoryName}</Text>
                    </View>

                    <View style={styles.catCardRight}>
                      <Text style={styles.catAmount}>
                        {formatCurrency(item.amount, 'INR', currencySymbol)}
                      </Text>
                      <Text style={styles.catPercent}>{item.percentage.toFixed(1)}%</Text>
                    </View>
                  </View>

                  {/* Animated Category Progress Bar */}
                  <View style={styles.catProgressBg}>
                    <View
                      style={[
                        styles.catProgressFill,
                        {
                          width: `${Math.min(100, item.percentage)}%`,
                          backgroundColor: item.categoryColor,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="bar-chart-outline" size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Spending Records</Text>
            <Text style={styles.emptyDesc}>
              Log transactions for {getMonthLabel(monthKey)} to unlock detailed category analytics.
            </Text>
          </View>
        )}

        {/* ── Daily Spending Trend Bar Chart ── */}
        {barData.length > 0 && stats.totalExpense > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleRow}>
                <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Ionicons name="stats-chart-outline" size={18} color="#60A5FA" />
                </View>
                <Text style={styles.cardTitle}>Daily Spending Trend</Text>
              </View>
            </View>

            {/* Peak Day Callout */}
            {peakDay ? (
              <View style={styles.peakCalloutRow}>
                <Ionicons name="flame" size={16} color="#F59E0B" />
                <Text style={styles.peakCalloutText}>
                  Peak Spend:{' '}
                  <Text style={{ fontWeight: '700', color: '#F59E0B' }}>
                    {formatCurrency(peakDay.amount, 'INR', currencySymbol)}
                  </Text>{' '}
                  on Day {peakDay.date.slice(8)}
                </Text>
              </View>
            ) : null}

            <View style={{ marginTop: spacing.md, overflow: 'hidden', alignItems: 'center' }}>
              <BarChart
                data={barData}
                barWidth={10}
                spacing={10}
                roundedTop
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                noOfSections={3}
                barBorderRadius={4}
              />
            </View>
          </View>
        ) : null}

        {/* ── Smart Financial Insights & Nudges ── */}
        {stats.totalExpense > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderTitleRow}>
              <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.cardTitle}>Smart Financial Insights</Text>
            </View>

            <View style={styles.insightsList}>
              {/* Insight 1: Top Driver */}
              {topCategory ? (
                <View style={styles.insightItem}>
                  <View style={[styles.insightDot, { backgroundColor: topCategory.categoryColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>Primary Spending Driver</Text>
                    <Text style={styles.insightDesc}>
                      <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                        {topCategory.categoryName}
                      </Text>{' '}
                      makes up{' '}
                      <Text style={{ fontWeight: '700', color: topCategory.categoryColor }}>
                        {topCategory.percentage.toFixed(0)}%
                      </Text>{' '}
                      of your total monthly expenses.
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Insight 2: Daily Pace */}
              <View style={styles.insightItem}>
                <View style={[styles.insightDot, { backgroundColor: '#3B82F6' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Daily Burn Velocity</Text>
                  <Text style={styles.insightDesc}>
                    You are spending an average of{' '}
                    <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                      {formatCurrency(dailyAverage, 'INR', currencySymbol)}
                    </Text>{' '}
                    per day this month.
                  </Text>
                </View>
              </View>

              {/* Insight 3: Savings Health */}
              <View style={styles.insightItem}>
                <View
                  style={[
                    styles.insightDot,
                    { backgroundColor: stats.netBalance >= 0 ? '#10B981' : '#EF4444' },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Net Cashflow Status</Text>
                  <Text style={styles.insightDesc}>
                    {stats.netBalance >= 0 ? (
                      <Text style={{ color: '#10B981' }}>
                        Great job! You have saved{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {formatCurrency(stats.netBalance, 'INR', currencySymbol)}
                        </Text>{' '}
                        this month.
                      </Text>
                    ) : (
                      <Text style={{ color: '#EF4444' }}>
                        Your expenses exceed income by{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {formatCurrency(Math.abs(stats.netBalance), 'INR', currencySymbol)}
                        </Text>
                        .
                      </Text>
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 20,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  exportBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  exportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    justifyContent: 'center',
  },
  exportText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 12,
  },
  yearlyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    justifyContent: 'center',
  },
  yearlyToggleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  // Hero Card
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  heroGradient: {
    padding: spacing.xl,
    position: 'relative',
  },
  decorRing1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  decorRing2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  heroLabel: {
    ...typography.label,
    color: 'rgba(216, 180, 254, 0.85)',
    letterSpacing: 1.2,
  },
  momPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  momPillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  heroAmount: {
    ...typography.heading,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.lg,
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.caption,
    color: 'rgba(209, 213, 219, 0.75)',
    fontSize: 11,
  },
  metricVal: {
    ...typography.bodyMedium,
    fontWeight: '700',
    marginTop: 3,
    fontSize: 13,
  },
  gridDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  // Card Container
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 16,
  },
  cardSubtitleCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pieWrapper: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },

  // Category Progress Card List
  catList: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  catCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  catCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  catCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  catCardRight: {
    alignItems: 'flex-end',
  },
  catAmount: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  catPercent: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  catProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginTop: 2,
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Peak Callout
  peakCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginVertical: spacing.xs,
  },
  peakCalloutText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Insights List
  insightsList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  insightTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  insightDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Empty State Card
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  emptyDesc: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
