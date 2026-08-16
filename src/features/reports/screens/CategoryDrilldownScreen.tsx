import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReportsStackParamList } from '../../../core/navigation/ReportsStackNavigator';
import { useTransactions } from '../../../context/TransactionContext';
import { useCategories } from '../../../context/CategoryContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { formatTransactionDate, getMonthKey } from '../../../shared/utils/dateUtils';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { Transaction } from '../../../shared/types/transaction.types';
import { useAppTheme } from '../../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<ReportsStackParamList, 'CategoryDrilldown'>;
  route: RouteProp<ReportsStackParamList, 'CategoryDrilldown'>;
};

export default function CategoryDrilldownScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { categoryId, monthKey } = route.params;
  const { transactions } = useTransactions();
  const { getById } = useCategories();
  const { settings } = useSettings();
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const category = getById(categoryId);

  const filtered = useMemo(() => {
    return transactions.filter(
      (t) => t.categoryId === categoryId && getMonthKey(t.date) === monthKey,
    );
  }, [transactions, categoryId, monthKey]);

  const total = useMemo(() => {
    return filtered.reduce((s, t) => s + t.amount, 0);
  }, [filtered]);

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader
        title={category?.name ?? 'Category Drilldown'}
        subtitle={`Period: ${monthKey}`}
        onBack={() => navigation.goBack()}
      />

      <View style={[styles.summaryCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
        <View style={[styles.iconBg, { backgroundColor: `${category?.color ?? tc.primary}20` }]}>
          <Ionicons name={(category?.icon ?? 'apps-outline') as any} size={28} color={category?.color ?? tc.primary} />
        </View>
        <Text style={[styles.totalLabel, { color: tc.textMuted }]}>Total Spent</Text>
        <Text style={[styles.totalVal, { color: tc.textPrimary }]}>{formatCurrency(total, 'INR', currencySymbol)}</Text>
        <Text style={[styles.countText, { color: tc.textSecondary }]}>{filtered.length} Transactions</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }: { item: Transaction }) => (
          <View style={[styles.txCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.txInfo}>
              <Text style={[styles.txTitle, { color: tc.textPrimary }]}>{item.notes || category?.name}</Text>
              <Text style={[styles.txSub, { color: tc.textMuted }]}>{formatTransactionDate(item.date)}</Text>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, { color: item.type === 'income' ? tc.income : tc.expense }]}>
                {formatCurrency(item.amount, 'INR', currencySymbol)}
              </Text>
              <Text style={[styles.txMethod, { color: tc.textMuted }]}>{(item.paymentMethod || 'cash').toUpperCase()}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryCard: {
    margin: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  totalVal: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 28,
    marginVertical: 2,
  },
  countText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  txSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...typography.bodyMedium,
    color: colors.expense,
  },
  txMethod: {
    ...typography.label,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
});
