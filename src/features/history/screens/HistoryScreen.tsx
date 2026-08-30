import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { HistoryStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { useAppTheme } from '../../../context/ThemeContext';
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

// ─── Payment method filter options ───────────────────────────────────────────
type PaymentMethodFilter = 'all' | 'upi' | 'cash' | 'card' | 'netbanking' | 'wallet';

const PAYMENT_METHOD_OPTIONS: {
  key: PaymentMethodFilter;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: 'all', label: 'All Methods', icon: 'layers-outline', color: '#94A3B8' },
  { key: 'upi', label: 'UPI', icon: 'phone-portrait-outline', color: '#6366F1' },
  { key: 'cash', label: 'Cash', icon: 'cash-outline', color: '#10B981' },
  { key: 'card', label: 'Card', icon: 'card-outline', color: '#F59E0B' },
  { key: 'netbanking', label: 'Net Banking', icon: 'globe-outline', color: '#38BDF8' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet-outline', color: '#F472B6' },
];

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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodFilter>('all');

  // ── Filtered transactions (type + method + search) ────────────────────────
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Payment method filter
      if (selectedMethod !== 'all') {
        const txMethod = (t.paymentMethod || 'cash').toLowerCase().replace(/\s+/g, '');
        const filterMethod = selectedMethod.toLowerCase();
        if (txMethod !== filterMethod) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNote = t.notes?.toLowerCase().includes(q);
        const catName = getById(t.categoryId)?.name || t.categoryNameSnapshot || '';
        const matchesCategory = catName.toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        const matchesMethod = (t.paymentMethod || '').toLowerCase().includes(q);
        return matchesNote || matchesCategory || matchesAmount || matchesMethod;
      }
      return true;
    });
  }, [transactions, selectedType, selectedMethod, searchQuery, getById]);

  // ── Count badges for type tabs ────────────────────────────────────────────
  const counts = useMemo(() => ({
    all: transactions.length,
    expense: transactions.filter((t) => t.type === 'expense').length,
    income: transactions.filter((t) => t.type === 'income').length,
  }), [transactions]);

  // ── Count badges for payment method tabs ─────────────────────────────────
  const methodCounts = useMemo(() => {
    const map: Record<string, number> = { all: 0 };
    for (const t of transactions) {
      map.all++;
      const m = (t.paymentMethod || 'cash').toLowerCase().replace(/\s+/g, '');
      map[m] = (map[m] || 0) + 1;
    }
    return map;
  }, [transactions]);

  // ── Filtered scope sums ───────────────────────────────────────────────────
  const scopeSums = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const grouped = useMemo(() => groupByDate(filteredTransactions, (t) => t.date), [filteredTransactions]);

  // ─────────────────────────────────────────────────────────────────────────
  const renderTransactionItem = (item: Transaction) => {
    const isExpense = item.type === 'expense';
    const amountColor = isExpense ? tc.expense : tc.income;
    const cat = getById(item.categoryId);
    const catName = cat?.name || item.categoryNameSnapshot || 'General';
    const catIcon = cat?.icon || item.categoryIconSnapshot || (isExpense ? 'receipt-outline' : 'wallet-outline');
    const catColor = cat?.color || item.categoryColorSnapshot || (isExpense ? '#F43F5E' : '#10B981');
    const method = (item.paymentMethod || 'cash').toUpperCase();

    // Highlight the method badge if it matches the active filter
    const methodKey = (item.paymentMethod || 'cash').toLowerCase().replace(/\s+/g, '') as PaymentMethodFilter;
    const methodOption = PAYMENT_METHOD_OPTIONS.find((o) => o.key === methodKey);
    const isMethodHighlighted = selectedMethod !== 'all' && selectedMethod === methodKey;

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
          <Text style={[styles.txTitle, { color: tc.textPrimary }]} numberOfLines={1}>
            {catName}
          </Text>
          <View style={styles.txMetaRow}>
            {/* Payment method badge — highlighted when filter active */}
            <View
              style={[
                styles.methodBadge,
                {
                  backgroundColor: isMethodHighlighted
                    ? `${methodOption?.color || theme.accentColor}22`
                    : tc.surface,
                  borderColor: isMethodHighlighted
                    ? `${methodOption?.color || theme.accentColor}55`
                    : tc.cardBorder,
                  borderWidth: isMethodHighlighted ? 1 : 1,
                },
              ]}
            >
              {methodOption && (
                <Ionicons
                  name={methodOption.icon as any}
                  size={9}
                  color={isMethodHighlighted ? (methodOption.color) : tc.textMuted}
                  style={{ marginRight: 2 }}
                />
              )}
              <Text
                style={[
                  styles.methodText,
                  { color: isMethodHighlighted ? (methodOption?.color || theme.accentColor) : tc.textMuted },
                ]}
              >
                {method}
              </Text>
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

      {/* ── Search Bar ── */}
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

      {/* ── Type Filter (All / Expenses / Income) ── */}
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
                  backgroundColor: isSelected ? `${theme.accentColor}22` : tc.card,
                  borderColor: isSelected ? theme.accentColor : tc.cardBorder,
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

      {/* ── Payment Method Filter Row ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.methodFilterRow}
      >
        {PAYMENT_METHOD_OPTIONS.map((opt) => {
          const isSelected = selectedMethod === opt.key;
          const count = opt.key === 'all' ? methodCounts.all : (methodCounts[opt.key] || 0);

          // Don't show methods with 0 transactions (except "All")
          if (opt.key !== 'all' && count === 0) return null;

          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.methodPill,
                {
                  backgroundColor: isSelected ? `${opt.color}22` : tc.card,
                  borderColor: isSelected ? opt.color : tc.cardBorder,
                  borderWidth: isSelected ? 1.5 : 1,
                },
              ]}
              onPress={() => {
                hapticSelection();
                setSelectedMethod(opt.key);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={opt.icon as any}
                size={13}
                color={isSelected ? opt.color : tc.textMuted}
              />
              <Text
                style={[
                  styles.methodPillText,
                  { color: isSelected ? opt.color : tc.textSecondary },
                  isSelected && { fontWeight: '800' },
                ]}
              >
                {opt.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.methodCountBadge,
                    {
                      backgroundColor: isSelected ? opt.color : tc.surface,
                    },
                  ]}
                >
                  <Text style={[styles.methodCountText, { color: isSelected ? '#FFFFFF' : tc.textMuted }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Active Filter Summary Strip ── */}
      {(selectedMethod !== 'all' || selectedType !== 'all' || searchQuery) && (
        <View style={[styles.activeFilterStrip, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
          <View style={styles.activeFilterLeft}>
            <Ionicons name="funnel" size={12} color={theme.accentColor} />
            <Text style={[styles.activeFilterText, { color: tc.textSecondary }]}>
              <Text style={{ color: tc.textPrimary, fontWeight: '800' }}>{scopeSums.count}</Text>
              {' '}result{scopeSums.count !== 1 ? 's' : ''}
              {selectedMethod !== 'all' ? ` · ${PAYMENT_METHOD_OPTIONS.find(o => o.key === selectedMethod)?.label}` : ''}
              {selectedType !== 'all' ? ` · ${selectedType === 'expense' ? 'Expenses' : 'Income'}` : ''}
              {searchQuery ? ` · "${searchQuery}"` : ''}
            </Text>
          </View>
          <View style={styles.activeFilterAmounts}>
            {scopeSums.income > 0 && (
              <Text style={[styles.incomeScopeText, { color: tc.income }]}>
                +{formatCurrency(scopeSums.income, 'INR', currencySymbol)}
              </Text>
            )}
            {scopeSums.expense > 0 && (
              <Text style={[styles.expenseScopeText, { color: tc.expense }]}>
                -{formatCurrency(scopeSums.expense, 'INR', currencySymbol)}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* ── Scope Summary Strip (always visible) ── */}
      {filteredTransactions.length > 0 && !selectedMethod && !selectedType && !searchQuery && (
        <View style={[styles.scopeSummaryStrip, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
          <Text style={[styles.scopeSummaryText, { color: tc.textSecondary }]}>
            Showing <Text style={{ fontWeight: '800', color: tc.textPrimary }}>{scopeSums.count}</Text> transactions
          </Text>
          <View style={styles.scopePills}>
            {scopeSums.income > 0 && (
              <Text style={[styles.incomeScopeText, { color: tc.income }]}>
                +{formatCurrency(scopeSums.income, 'INR', currencySymbol)}
              </Text>
            )}
            {scopeSums.expense > 0 && (
              <Text style={[styles.expenseScopeText, { color: tc.expense }]}>
                -{formatCurrency(scopeSums.expense, 'INR', currencySymbol)}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* ── Transaction Feed ── */}
      {grouped.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="document-text-outline"
            title="No Transactions Found"
            subtitle={
              selectedMethod !== 'all'
                ? `No ${PAYMENT_METHOD_OPTIONS.find(o => o.key === selectedMethod)?.label} transactions found.`
                : searchQuery
                ? 'No matching records found for this query.'
                : 'Add an expense or income to begin.'
            }
          />
          {/* Clear filters button */}
          {(selectedMethod !== 'all' || selectedType !== 'all' || searchQuery.trim()) && (
            <TouchableOpacity
              style={[styles.clearFiltersBtn, { backgroundColor: `${theme.accentColor}22`, borderColor: theme.accentColor }]}
              onPress={() => {
                setSelectedMethod('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
            >
              <Ionicons name="close-circle-outline" size={16} color={theme.accentColor} />
              <Text style={[styles.clearFiltersBtnText, { color: theme.accentColor }]}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
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
                    <Text style={[styles.sectionHeaderExpense, { color: tc.expense }]}>
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
  container: { flex: 1 },

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
    letterSpacing: -0.3,
  },
  headerCount: {
    fontSize: 12,
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
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  clearSearchBtn: { padding: 2 },

  // Type Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
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
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  pillCountText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Payment Method Filter Row
  methodFilterRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  methodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1,
  },
  methodPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  methodCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  methodCountText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // Active filter summary
  activeFilterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  activeFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  activeFilterText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  activeFilterAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  // Scope summary
  scopeSummaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scopeSummaryText: { fontSize: 11 },
  scopePills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incomeScopeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  expenseScopeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // List
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  sectionBlock: { marginBottom: 16 },
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderExpense: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCardList: { gap: 8 },

  // Transaction Cards
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  txSub: {
    fontSize: 11,
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

  // Empty state
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearFiltersBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
