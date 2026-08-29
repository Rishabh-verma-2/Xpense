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
import { useAppTheme } from '../../../context/ThemeContext';
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
  const { theme } = useAppTheme();
  const tc = theme.colors;
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
      value: typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0,
      color: item.categoryColor || '#7C3AED',
      text: `${(typeof item.percentage === 'number' && !isNaN(item.percentage) ? item.percentage : 0).toFixed(0)}%`,
    }));
  }, [stats.categoryBreakdown]);

  const barData = useMemo(() => {
    return stats.dailyTrend.map((item) => {
      const isPeak = peakDay && item.date === peakDay.date;
      return {
        value: item.amount,
        label: item.date.slice(8),
        frontColor: isPeak ? '#F59E0B' : '#7C3AED',
      };
    });
  }, [stats.dailyTrend, peakDay]);

  const topCategory = stats.categoryBreakdown[0] ?? null;

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingTop: topInset }]}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Financial Reports</Text>
          <Text style={[styles.headerSubtitle, { color: tc.textMuted }]}>{getMonthLabel(monthKey)}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => setShowExportModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[`${theme.accentColor}33`, `${tc.primary}1A`]}
              style={styles.exportGradient}
            >
              <Ionicons name="download-outline" size={15} color={theme.accentColor} />
              <Text style={[styles.exportText, { color: theme.accentColor }]}>Export</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.yearlyToggleBtn, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
            onPress={() => navigation.navigate('YearlyReport', { year: monthKey.slice(0, 4) })}
            activeOpacity={0.8}
          >
            <Text style={[styles.yearlyToggleText, { color: theme.accentColor }]}>Yearly</Text>
            <Ionicons name="calendar-outline" size={14} color={theme.accentColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Picker Selector */}
      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Luxury Theme Hero Overview Card ── */}
        <View style={[styles.heroCard, { borderColor: theme.colors.cardBorderActive }]}>
          <LinearGradient
            colors={theme.heroGradient}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.decorGlow1, { backgroundColor: theme.colors.mesh1 }]} />
            <View style={[styles.decorGlow2, { backgroundColor: theme.colors.mesh2 }]} />
            <View style={styles.specularTopLine} />

            {/* Top row: Label & MoM Pill */}
            <View style={styles.heroHeaderRow}>
              <View style={styles.tagRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.heroLabel}>MONTHLY OUTFLOW</Text>
              </View>

              {momExpenseChange ? (
                <View
                  style={[
                    styles.momPill,
                    {
                      backgroundColor: momExpenseChange.isIncreased
                        ? 'rgba(244, 63, 94, 0.18)'
                        : 'rgba(16, 185, 129, 0.18)',
                      borderColor: momExpenseChange.isIncreased
                        ? 'rgba(244, 63, 94, 0.35)'
                        : 'rgba(16, 185, 129, 0.35)',
                    },
                  ]}
                >
                  <Ionicons
                    name={momExpenseChange.isIncreased ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={momExpenseChange.isIncreased ? '#F43F5E' : '#10B981'}
                  />
                  <Text
                    style={[
                      styles.momPillText,
                      { color: momExpenseChange.isIncreased ? '#F43F5E' : '#10B981' },
                    ]}
                  >
                    {momExpenseChange.percentage}% {momExpenseChange.isIncreased ? 'more' : 'less'} vs last mo
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
                <Text style={styles.metricLabel}>Total Inflow</Text>
                <Text style={[styles.metricVal, { color: '#10B981' }]}>
                  +{formatCurrency(stats.totalIncome, 'INR', currencySymbol)}
                </Text>
              </View>

              <View style={styles.gridDivider} />

              <View style={styles.heroMetricItem}>
                <Text style={styles.metricLabel}>Net Cashflow</Text>
                <Text
                  style={[
                    styles.metricVal,
                    { color: stats.netBalance >= 0 ? '#38BDF8' : '#F43F5E' },
                  ]}
                >
                  {formatCurrency(stats.netBalance, 'INR', currencySymbol)}
                </Text>
              </View>

              <View style={styles.gridDivider} />

              <View style={styles.heroMetricItem}>
                <Text style={styles.metricLabel}>Daily Burn</Text>
                <Text style={[styles.metricVal, { color: theme.accentColor }]}>
                  {formatCurrency(dailyAverage, 'INR', currencySymbol)}/d
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Category Breakdown Ring & Progress Cards ── */}
        {stats.categoryBreakdown.length > 0 ? (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleRow}>
                <View style={[styles.cardHeaderIconBg, { backgroundColor: `${theme.accentColor}22` }]}>
                  <Ionicons name="pie-chart-outline" size={18} color={theme.accentColor} />
                </View>
                <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Spending by Category</Text>
              </View>
              <Text style={[styles.cardSubtitleCount, { color: tc.textMuted }]}>
                {stats.categoryBreakdown.length} Categories
              </Text>
            </View>

            {/* Donut Chart */}
            <View style={styles.pieWrapper}>
              <PieChart
                data={pieData}
                donut
                radius={84}
                innerRadius={60}
                innerCircleColor={tc.card}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: tc.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>
                      Spent
                    </Text>
                    <Text style={{ fontSize: 14, color: tc.textPrimary, fontWeight: '900', marginTop: 2 }}>
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
                  style={[styles.catCard, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}
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
                      <Text style={[styles.catName, { color: tc.textPrimary }]}>{item.categoryName}</Text>
                    </View>

                    <View style={styles.catCardRight}>
                      <Text style={[styles.catAmount, { color: tc.textPrimary }]}>
                        {formatCurrency(item.amount, 'INR', currencySymbol)}
                      </Text>
                      <Text style={[styles.catPercent, { color: tc.textMuted }]}>
                        {(typeof item.percentage === 'number' && !isNaN(item.percentage) ? item.percentage : 0).toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  {/* Animated Category Progress Bar */}
                  <View style={[styles.catProgressBg, { backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)' }]}>
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
          <View style={[styles.emptyCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: tc.surface }]}>
              <Ionicons name="bar-chart-outline" size={32} color={tc.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No Spending Records</Text>
            <Text style={[styles.emptyDesc, { color: tc.textSecondary }]}>
              Log transactions for {getMonthLabel(monthKey)} to unlock detailed category analytics.
            </Text>
          </View>
        )}

        {/* ── Daily Spending Trend Bar Chart ── */}
        {barData.length > 0 && stats.totalExpense > 0 ? (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleRow}>
                <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Ionicons name="stats-chart-outline" size={18} color="#60A5FA" />
                </View>
                <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Daily Spending Trend</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.75 }}>
                <Text style={{ fontSize: 11, color: tc.textMuted, fontWeight: '600' }}>Swipe</Text>
                <Ionicons name="swap-horizontal" size={14} color={tc.textMuted} />
              </View>
            </View>

            {/* Peak Day Callout */}
            {peakDay ? (
              <View style={[styles.peakCalloutRow, { backgroundColor: `${tc.primary}12`, borderColor: `${tc.primary}33` }]}>
                <Ionicons name="flame" size={16} color="#F59E0B" />
                <Text style={[styles.peakCalloutText, { color: tc.textSecondary }]}>
                  Peak Spend:{' '}
                  <Text style={{ fontWeight: '800', color: '#F59E0B' }}>
                    {formatCurrency(peakDay.amount, 'INR', currencySymbol)}
                  </Text>{' '}
                  on Day {peakDay.date.slice(8)}
                </Text>
              </View>
            ) : null}

            <View style={{ marginTop: 14 }}>
              <BarChart
                data={barData}
                width={width - 76}
                height={160}
                barWidth={14}
                spacing={10}
                initialSpacing={10}
                endSpacing={24}
                roundedTop
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: tc.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: tc.textMuted, fontSize: 9 }}
                noOfSections={3}
                barBorderRadius={4}
                nestedScrollEnabled={true}
                showScrollIndicator={true}
                isAnimated
              />
            </View>
          </View>
        ) : null}

        {/* ── Smart Financial Insights & Nudges ── */}
        {stats.totalExpense > 0 ? (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.cardHeaderTitleRow}>
              <View style={[styles.cardHeaderIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Smart Financial Insights</Text>
            </View>

            <View style={styles.insightsList}>
              {/* Insight 1: Top Driver */}
              {topCategory ? (
                <View style={styles.insightItem}>
                  <View style={[styles.insightDot, { backgroundColor: topCategory.categoryColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insightTitle, { color: tc.textPrimary }]}>Primary Spending Driver</Text>
                    <Text style={[styles.insightDesc, { color: tc.textSecondary }]}>
                      <Text style={{ fontWeight: '800', color: tc.textPrimary }}>
                        {topCategory.categoryName}
                      </Text>{' '}
                      makes up{' '}
                      <Text style={{ fontWeight: '800', color: topCategory.categoryColor }}>
                        {(typeof topCategory.percentage === 'number' && !isNaN(topCategory.percentage) ? topCategory.percentage : 0).toFixed(0)}%
                      </Text>{' '}
                      of your total monthly expenses.
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Insight 2: Daily Pace */}
              <View style={styles.insightItem}>
                <View style={[styles.insightDot, { backgroundColor: '#38BDF8' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightTitle, { color: tc.textPrimary }]}>Daily Burn Velocity</Text>
                  <Text style={[styles.insightDesc, { color: tc.textSecondary }]}>
                    You are spending an average of{' '}
                    <Text style={{ fontWeight: '800', color: tc.textPrimary }}>
                      {formatCurrency(dailyAverage, 'INR', currencySymbol)}
                    </Text>{' '}
                    per active day this month.
                  </Text>
                </View>
              </View>

              {/* Insight 3: Savings Health */}
              <View style={styles.insightItem}>
                <View
                  style={[
                    styles.insightDot,
                    { backgroundColor: stats.netBalance >= 0 ? '#10B981' : '#F43F5E' },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightTitle, { color: tc.textPrimary }]}>Net Cashflow Status</Text>
                  <Text style={[styles.insightDesc, { color: tc.textSecondary }]}>
                    {stats.netBalance >= 0 ? (
                      <Text style={{ color: '#10B981' }}>
                        Great job! You retained{' '}
                        <Text style={{ fontWeight: '800' }}>
                          {formatCurrency(stats.netBalance, 'INR', currencySymbol)}
                        </Text>{' '}
                        more than you spent this month.
                      </Text>
                    ) : (
                      <Text style={{ color: '#F43F5E' }}>
                        Expenses exceeded total income by{' '}
                        <Text style={{ fontWeight: '800' }}>
                          {formatCurrency(Math.abs(stats.netBalance), 'INR', currencySymbol)}
                        </Text>
                        . Consider reviewing category budgets.
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
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  exportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  exportText: {
    fontSize: 12,
    color: '#C084FC',
    fontWeight: '700',
  },
  yearlyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  yearlyToggleText: {
    fontSize: 12,
    color: '#C084FC',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Safe padding for popped-out glass bottom bar
    gap: 14,
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
    padding: 20,
    position: 'relative',
  },
  decorGlow1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  decorGlow2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  specularTopLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F43F5E',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#D8B4FE',
  },
  momPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  momPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginVertical: 4,
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  gridDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Cards
  card: {
    backgroundColor: '#120F20',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  cardSubtitleCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  pieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },

  // Category List
  catList: {
    gap: 8,
    marginTop: 8,
  },
  catCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  catCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  catCardRight: {
    alignItems: 'flex-end',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  catPercent: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 1,
  },
  catProgressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Peak Callout
  peakCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  peakCalloutText: {
    fontSize: 11,
    color: '#CBD5E1',
  },

  // Insights List
  insightsList: {
    gap: 12,
    marginTop: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  insightDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#120F20',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
