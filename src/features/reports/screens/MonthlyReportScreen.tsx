import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReportsStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getMonthKey, shiftMonth } from '../../../shared/utils/dateUtils';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { MonthSelector } from '../../../shared/components/MonthSelector';
import { computeMonthlyStats } from '../services/reportEngine';
import { PieChart, BarChart } from 'react-native-gifted-charts';

import { ExportModal } from '../../../shared/components/ExportModal';

type Props = {
  navigation: NativeStackNavigationProp<ReportsStackParamList, 'MonthlyReport'>;
};

export default function MonthlyReportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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

  const pieData = useMemo(() => {
    return stats.categoryBreakdown.map((item) => ({
      value: item.amount,
      color: item.categoryColor,
      text: `${item.percentage.toFixed(0)}%`,
    }));
  }, [stats.categoryBreakdown]);

  const barData = useMemo(() => {
    return stats.dailyTrend.map((item) => ({
      value: item.amount,
      label: item.date.slice(8), // day number
      frontColor: colors.primary,
    }));
  }, [stats.dailyTrend]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Monthly/Yearly toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Reports</Text>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <TouchableOpacity
            style={styles.exportHeaderBtn}
            onPress={() => setShowExportModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={16} color={colors.primaryLight} />
            <Text style={styles.exportHeaderText}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => navigation.navigate('YearlyReport', { year: monthKey.slice(0, 4) })}
          >
            <Text style={styles.toggleText}>Yearly</Text>
            <Ionicons name="swap-horizontal-outline" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Overview Summary Card */}
        <View style={styles.overviewCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryVal, { color: colors.income }]}>
              {formatCurrency(stats.totalIncome, 'INR', currencySymbol)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryVal, { color: colors.expense }]}>
              {formatCurrency(stats.totalExpense, 'INR', currencySymbol)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Savings</Text>
            <Text style={[styles.summaryVal, { color: stats.netBalance >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(stats.netBalance, 'INR', currencySymbol)}
            </Text>
          </View>
        </View>

        {/* Category Breakdown Pie Chart */}
        {stats.categoryBreakdown.length > 0 ? (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Spending by Category</Text>
            <View style={styles.pieWrapper}>
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={55}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Total</Text>
                    <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>
                      {formatCurrency(stats.totalExpense, 'INR', currencySymbol)}
                    </Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.catList}>
              {stats.categoryBreakdown.map((item) => (
                <TouchableOpacity
                  key={item.categoryId}
                  style={styles.catRow}
                  onPress={() =>
                    navigation.navigate('CategoryDrilldown', {
                      categoryId: item.categoryId,
                      monthKey,
                    })
                  }
                >
                  <View style={styles.catLeft}>
                    <View style={[styles.catDot, { backgroundColor: item.categoryColor }]} />
                    <Ionicons name={item.categoryIcon as any} size={16} color={item.categoryColor} />
                    <Text style={styles.catName}>{item.categoryName}</Text>
                  </View>
                  <Text style={styles.catVal}>
                    {formatCurrency(item.amount, 'INR', currencySymbol)} ({item.percentage.toFixed(1)}%)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No spending data for this month</Text>
          </View>
        )}

        {/* Daily Spending Trend Bar Chart */}
        {barData.length > 0 && stats.totalExpense > 0 ? (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Daily Spending Trend</Text>
            <View style={{ marginTop: spacing.md, overflow: 'hidden' }}>
              <BarChart
                data={barData}
                barWidth={10}
                spacing={12}
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
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  toggleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  summaryVal: {
    ...typography.bodyMedium,
    fontWeight: '700',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: colors.cardBorder,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pieWrapper: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  catList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  catVal: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },

  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  exportHeaderText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
});
