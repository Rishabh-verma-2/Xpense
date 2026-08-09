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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReportsStackParamList } from '../../../core/navigation/ReportsStackNavigator';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getYearKey, shiftYear } from '../../../shared/utils/dateUtils';
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

  const barData = useMemo(() => {
    const data: any[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthlyTotals.forEach((m, idx) => {
      data.push({
        value: m.income,
        frontColor: colors.income,
        spacing: 2,
        label: monthNames[idx],
      });
      data.push({
        value: m.expense,
        frontColor: colors.expense,
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
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.yearText}>{year}</Text>
        <TouchableOpacity
          style={styles.yearBtn}
          onPress={() => setYear(shiftYear(year, 1))}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Total Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.sumItem}>
            <Text style={styles.sumLabel}>Total Income</Text>
            <Text style={[styles.sumVal, { color: colors.income }]}>
              {formatCurrency(yearlyIncome, 'INR', currencySymbol)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.sumItem}>
            <Text style={styles.sumLabel}>Total Expense</Text>
            <Text style={[styles.sumVal, { color: colors.expense }]}>
              {formatCurrency(yearlyExpense, 'INR', currencySymbol)}
            </Text>
          </View>
        </View>

        {/* 12-month grouped bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Income vs Expense by Month</Text>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
              <Text style={styles.legendText}>Expense</Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.md, overflow: 'hidden' }}>
            <BarChart
              data={barData}
              barWidth={8}
              initialSpacing={10}
              spacing={14}
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  yearBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  yearText: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sumItem: {
    flex: 1,
    alignItems: 'center',
  },
  sumLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sumVal: {
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
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
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
    color: colors.textMuted,
  },
});
