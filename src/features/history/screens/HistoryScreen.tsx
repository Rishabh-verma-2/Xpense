import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HistoryStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { formatTransactionDate, groupByDate } from '../../../shared/utils/dateUtils';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Transaction } from '../../../shared/types/transaction.types';

type Props = {
  navigation: NativeStackNavigationProp<HistoryStackParamList, 'HistoryList'>;
};

export default function HistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNote = t.notes?.toLowerCase().includes(q);
        const matchesCategory = t.categoryNameSnapshot.toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        return matchesNote || matchesCategory || matchesAmount;
      }
      return true;
    });
  }, [transactions, selectedType, searchQuery]);

  const grouped = useMemo(() => {
    return groupByDate(filteredTransactions, (t) => t.date);
  }, [filteredTransactions]);

  const renderTransactionItem = (item: Transaction) => {
    const isExpense = item.type === 'expense';
    const amountColor = isExpense ? colors.expense : colors.income;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.txCard}
        onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBg, { backgroundColor: `${item.categoryColorSnapshot}20` }]}>
          <Ionicons name={item.categoryIconSnapshot as any} size={20} color={item.categoryColorSnapshot} />
        </View>

        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>{item.categoryNameSnapshot}</Text>
          <Text style={styles.txSub}>
            {item.notes ? item.notes : formatTransactionDate(item.date)}
          </Text>
        </View>

        <View style={styles.txAmountCol}>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {isExpense ? '-' : '+'}{formatCurrency(item.amount, 'INR', currencySymbol)}
          </Text>
          <Text style={styles.txMethod}>{item.paymentMethod.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, category, amount..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Type Filter Pills */}
      <View style={styles.filterPills}>
        {(['all', 'expense', 'income'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.pill, selectedType === t && styles.pillActive]}
            onPress={() => setSelectedType(t)}
          >
            <Text style={[styles.pillText, selectedType === t && styles.pillTextActive]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      {grouped.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No Transactions Found"
          subtitle={searchQuery ? "Try searching for something else." : "Add your first expense or income to see it here."}
        />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>{item.title}</Text>
              {item.data.map(renderTransactionItem)}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  filterPills: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  txMethod: {
    ...typography.label,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
});
