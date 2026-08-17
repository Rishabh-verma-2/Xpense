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
import { LinearGradient } from 'expo-linear-gradient';
import type { HistoryStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { useAppTheme } from '../../../context/ThemeContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { formatTransactionDate, groupByDate } from '../../../shared/utils/dateUtils';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useCategories } from '../../../context/CategoryContext';
import { Transaction } from '../../../shared/types/transaction.types';
import { hapticSelection } from '../../../shared/utils/haptics';

type Props = {
  navigation: NativeStackNavigationProp<HistoryStackParamList, 'HistoryList'>;
};

export default function HistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);
  const { transactions } = useTransactions();
  const { getById } = useCategories();
  const { settings } = useSettings();
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNote = t.notes?.toLowerCase().includes(q);
        const catName = getById(t.categoryId)?.name || t.categoryNameSnapshot || '';
        const matchesCategory = catName.toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        return matchesNote || matchesCategory || matchesAmount;
      }
      return true;
    });
  }, [transactions, selectedType, searchQuery, getById]);

  // Compute live count badges
  const counts = useMemo(() => {
    return {
      all: transactions.length,
      expense: transactions.filter((t) => t.type === 'expense').length,
      income: transactions.filter((t) => t.type === 'income').length,
    };
  }, [transactions]);

  // Filtered scope sums
  const scopeSums = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const grouped = useMemo(() => {
    return groupByDate(filteredTransactions, (t) => t.date);
  }, [filteredTransactions]);

  const renderTransactionItem = (item: Transaction) => {
    const isExpense = item.type === 'expense';
    const amountColor = isExpense ? '#F43F5E' : '#10B981';
    const cat = getById(item.categoryId);
    const catName = cat?.name || item.categoryNameSnapshot || 'General';
    const catIcon = cat?.icon || item.categoryIconSnapshot || (isExpense ? 'receipt-outline' : 'wallet-outline');
    const catColor = cat?.color || item.categoryColorSnapshot || (isExpense ? '#F43F5E' : '#10B981');
    const method = (item.paymentMethod || 'cash').toUpperCase();

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.txCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
        onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.iconBg, { backgroundColor: `${catColor}1A` }]}>
          <Ionicons name={catIcon as any} size={20} color={catColor} />
        </View>

        <View style={styles.txInfo}>
          <Text style={[styles.txTitle, { color: tc.textPrimary }]} numberOfLines={1}>{catName}</Text>
          <View style={styles.txMetaRow}>
            <View style={[styles.methodBadge, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
              <Text style={[styles.methodText, { color: tc.textMuted }]}>{method}</Text>
            </View>
            <Text style={[styles.txSub, { color: tc.textMuted }]} numberOfLines={1}>
              {item.notes?.trim() ? item.notes : formatTransactionDate(item.date)}
            </Text>
          </View>
        </View>

        <View style={styles.txAmountCol}>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {isExpense ? '-' : '+'}{formatCurrency(item.amount, 'INR', currencySymbol)}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={tc.textMuted} style={{ marginTop: 2 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingTop: topInset }]}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Transaction History</Text>
        <Text style={[styles.headerCount, { color: tc.textMuted }]}>{transactions.length} Total Records</Text>
      </View>

      {/* ── Glass Search Bar ── */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <Ionicons name="search-outline" size={18} color={tc.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder="Search notes, category, amount..."
            placeholderTextColor={tc.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={tc.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Filter Segmented Pills with Live Badges ── */}
      <View style={styles.filterPillsRow}>
        {[
          { key: 'all' as const, label: 'All', count: counts.all },
          { key: 'expense' as const, label: 'Expenses', count: counts.expense },
          { key: 'income' as const, label: 'Income', count: counts.income },
        ].map((tab) => {
          const isSelected = selectedType === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterPill,
                {
                  backgroundColor: tc.card,
                  borderColor: isSelected ? theme.accentColor : tc.cardBorder,
                },
                isSelected && {
                  backgroundColor: `${theme.accentColor}22`,
                },
              ]}
              onPress={() => {
                hapticSelection();
                setSelectedType(tab.key);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: isSelected ? theme.accentColor : tc.textSecondary },
                  isSelected && { fontWeight: '800' },
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.pillCountBadge,
                  { backgroundColor: isSelected ? theme.accentColor : tc.surface },
                ]}
              >
                <Text
                  style={[
                    styles.pillCountText,
                    { color: isSelected ? '#FFFFFF' : tc.textMuted },
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Filter Scope Subtotal Header ── */}
      {filteredTransactions.length > 0 && (
        <View style={[styles.scopeSummaryStrip, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
          <Text style={[styles.scopeSummaryText, { color: tc.textSecondary }]}>
            Showing <Text style={{ fontWeight: '800', color: tc.textPrimary }}>{scopeSums.count}</Text> transactions
          </Text>
          <View style={styles.scopePills}>
            {selectedType !== 'expense' && scopeSums.income > 0 ? (
              <Text style={styles.incomeScopeText}>+{formatCurrency(scopeSums.income, 'INR', currencySymbol)}</Text>
            ) : null}
            {selectedType !== 'income' && scopeSums.expense > 0 ? (
              <Text style={styles.expenseScopeText}>-{formatCurrency(scopeSums.expense, 'INR', currencySymbol)}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Transaction Feed (With bottom bar clearance) ── */}
      {grouped.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="document-text-outline"
            title="No Transactions Found"
            subtitle={searchQuery ? "No matching records found for this query." : "Add an expense or income to begin."}
          />
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const dayExpense = item.data
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + t.amount, 0);

            return (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeaderTitle, { color: tc.textSecondary }]}>{item.title}</Text>
                  {dayExpense > 0 ? (
                    <Text style={styles.sectionHeaderExpense}>
                      -{formatCurrency(dayExpense, 'INR', currencySymbol)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.sectionCardList}>
                  {item.data.map(renderTransactionItem)}
                </View>
              </View>
            );
          }}
        />
      )}
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
    alignItems: 'baseline',
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
  headerCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Search
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120F20',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 2,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#120F20',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    borderColor: '#C084FC',
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pillCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillCountBadgeActive: {
    backgroundColor: '#C084FC',
  },
  pillCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  pillCountTextActive: {
    color: '#07060E',
  },

  // Scope Summary Strip
  scopeSummaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scopeSummaryText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  scopePills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incomeScopeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  expenseScopeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F43F5E',
  },

  // List Container with Bottom Bar clearance
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Safe clearance for popped-out glass bottom bar
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderExpense: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F43F5E',
  },
  sectionCardList: {
    gap: 8,
  },

  // Transaction Cards
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120F20',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  methodText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  txSub: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  txAmountCol: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },

  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
});
