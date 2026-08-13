import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReportsStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getYearKey, shiftYear, getMonthLabel } from '../../../shared/utils/dateUtils';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { computeYearlyTotals } from '../services/reportEngine';
import { BarChart } from 'react-native-gifted-charts';

type Props = {
  navigation: NativeStackNavigationProp<ReportsStackParamList, 'YearlyReport'>;
  route: RouteProp<ReportsStackParamList, 'YearlyReport'>;
};

export default function YearlyReportScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState(route.params?.year ?? getYearKey(new Date()));
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const monthlyTotals = useMemo(() => {
    return computeYearlyTotals(transactions, year);
  }, [transactions, year]);

  const yearlyIncome = monthlyTotals.reduce((s, m) => s + m.income, 0);
  const yearlyExpense = monthlyTotals.reduce((s, m) => s + m.expense, 0);
  const yearlyNet = yearlyIncome - yearlyExpense;

  const peakMonth = useMemo(() => {
    if (monthlyTotals.length === 0) return null;
    let max = monthlyTotals[0];
    for (const m of monthlyTotals) {
      if (m.expense > max.expense) max = m;
    }
    return max.expense > 0 ? max : null;
  }, [monthlyTotals]);

  const barData = useMemo(() => {
    const data: any[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthlyTotals.forEach((m, idx) => {
      data.push({
        value: m.income,
        frontColor: '#10B981',
        spacing: 2,
        label: monthNames[idx],
      });
      data.push({
        value: m.expense,
        frontColor: '#EF4444',
      });
    });
    return data;
  }, [monthlyTotals]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yearly Comparison ({year})</Text>
      </View>

      {/* Year Switcher */}
      <View style={styles.yearRow}>
        <TouchableOpacity
          style={styles.yearBtn}
          onPress={() => setYear(shiftYear(year, -1))}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.yearText}>{year}</Text>
        <TouchableOpacity
          style={styles.yearBtn}
          onPress={() => setYear(shiftYear(year, 1))}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Glassmorphic Total Summary Hero */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#1F1147', '#120831', '#0A051D']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.heroLabel}>TOTAL ANNUAL EXPENSES</Text>
            <Text style={styles.heroAmount}>
              {formatCurrency(yearlyExpense, 'INR', currencySymbol)}
            </Text>

            <View style={styles.heroGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Annual Income</Text>
                <Text style={[styles.gridVal, { color: colors.income }]}>
                  {formatCurrency(yearlyIncome, 'INR', currencySymbol)}
                </Text>
              </View>

              <View style={styles.gridDivider} />

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Annual Net</Text>
                <Text
                  style={[
                    styles.gridVal,
                    { color: yearlyNet >= 0 ? colors.income : colors.expense },
                  ]}
                >
                  {formatCurrency(yearlyNet, 'INR', currencySymbol)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 12-month Grouped Bar Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Income vs Expense by Month</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
            </View>
          </View>

          {peakMonth ? (
            <View style={styles.peakBadge}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.peakText}>
                Highest Expense Month:{' '}
                <Text style={{ fontWeight: '700', color: '#F59E0B' }}>
                  {getMonthLabel(peakMonth.month)} ({formatCurrency(peakMonth.expense, 'INR', currencySymbol)})
                </Text>
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: spacing.md, overflow: 'hidden', alignItems: 'center' }}>
            <BarChart
              data={barData}
              barWidth={8}
              initialSpacing={10}
              spacing={12}
              roundedTop
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              noOfSections={3}
            />
          </View>
        </View>

        {/* Monthly Breakdown List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Breakdown ({year})</Text>
          <View style={styles.monthList}>
            {monthlyTotals.map((m) => (
              <View key={m.month} style={styles.monthRow}>
                <Text style={styles.monthName}>{getMonthLabel(m.month)}</Text>
                <View style={styles.monthVals}>
                  <Text style={[styles.monthIncome, { color: colors.income }]}>
                    +{formatCurrency(m.income, 'INR', currencySymbol)}
                  </Text>
                  <Text style={[styles.monthExpense, { color: colors.expense }]}>
                    -{formatCurrency(m.expense, 'INR', currencySymbol)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 19,
    flex: 1,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    height: 42,
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xs,
  },
  yearBtn: {
    padding: spacing.xs,
  },
  yearText: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '700',
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
  },
  heroLabel: {
    ...typography.label,
    color: 'rgba(216, 180, 254, 0.85)',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  heroAmount: {
    ...typography.heading,
    fontSize: 32,
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
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    ...typography.caption,
    color: 'rgba(209, 213, 219, 0.75)',
    fontSize: 11,
  },
  gridVal: {
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

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  peakBadge: {
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
  peakText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  monthList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  monthName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  monthVals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  monthIncome: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
  monthExpense: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
});
