import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

// ─── Filter & Sort Options ───────────────────────────────────────────────────
type PaymentMethodFilter = 'all' | 'upi' | 'cash' | 'card' | 'netbanking' | 'wallet';
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

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

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'newest', label: 'Newest First', icon: 'calendar-outline' },
  { key: 'oldest', label: 'Oldest First', icon: 'time-outline' },
  { key: 'highest', label: 'Highest Amount', icon: 'trending-up-outline' },
  { key: 'lowest', label: 'Lowest Amount', icon: 'trending-down-outline' },
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

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Draft states for the modal
  const [draftMethod, setDraftMethod] = useState<PaymentMethodFilter>('all');
  const [draftSort, setDraftSort] = useState<SortOption>('newest');

  // Count active non-default filters (excluding the top 3-segment type tabs)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedMethod !== 'all') count++;
    if (sortBy !== 'newest') count++;
    return count;
  }, [selectedMethod, sortBy]);

  // ── Hardware Back Button Handling ──────────────────────────────────────────
  // If filter modal is open, close it; otherwise smoothly return to Dashboard tab
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isFilterModalOpen) {
          setIsFilterModalOpen(false);
          return true;
        }
        // Navigate to Dashboard tab
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate('DashboardTab');
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isFilterModalOpen, navigation])
  );

  // Open modal and sync drafts
  const handleOpenFilterModal = () => {
    hapticSelection();
    setDraftMethod(selectedMethod);
    setDraftSort(sortBy);
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = () => {
    hapticSelection();
    setSelectedMethod(draftMethod);
    setSortBy(draftSort);
    setIsFilterModalOpen(false);
  };

  const handleResetModalFilters = () => {
    hapticSelection();
    setDraftMethod('all');
    setDraftSort('newest');
  };

  const handleResetAllFilters = () => {
    hapticSelection();
    setSelectedType('all');
    setSelectedMethod('all');
    setSortBy('newest');
    setSearchQuery('');
  };

  // ── Filtered & Sorted transactions ─────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((t) => {
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

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'highest') return b.amount - a.amount;
      if (sortBy === 'lowest') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, selectedType, selectedMethod, searchQuery, sortBy, getById]);

  // Counts for Segmented Control
  const counts = useMemo(() => ({
    all: transactions.length,
    expense: transactions.filter((t) => t.type === 'expense').length,
    income: transactions.filter((t) => t.type === 'income').length,
  }), [transactions]);

  // Scope sums for quick review
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

  // ── Render Transaction Card ───────────────────────────────────────────────
  const renderTransactionItem = (item: Transaction) => {
    const isExpense = item.type === 'expense';
    const amountColor = isExpense ? tc.expense : tc.income;
    const cat = getById(item.categoryId);
    const catName = cat?.name || item.categoryNameSnapshot || 'General';
    const catIcon = cat?.icon || item.categoryIconSnapshot || (isExpense ? 'receipt-outline' : 'wallet-outline');
    const catColor = cat?.color || item.categoryColorSnapshot || (isExpense ? '#F43F5E' : '#10B981');
    const method = (item.paymentMethod || 'cash').toUpperCase();

    const methodKey = (item.paymentMethod || 'cash').toLowerCase().replace(/\s+/g, '') as PaymentMethodFilter;
    const methodOption = PAYMENT_METHOD_OPTIONS.find((o) => o.key === methodKey);

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
            <View style={[styles.methodBadge, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
              {methodOption && (
                <Ionicons
                  name={methodOption.icon as any}
                  size={9}
                  color={tc.textMuted}
                  style={{ marginRight: 3 }}
                />
              )}
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

  const selectedMethodOption = PAYMENT_METHOD_OPTIONS.find((o) => o.key === selectedMethod);
  const selectedSortOption = SORT_OPTIONS.find((o) => o.key === sortBy);

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingTop: topInset }]}>
      
      {/* ── 1. Clean Header Row ── */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <TouchableOpacity
            style={[styles.headerBackBtn, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
            onPress={() => navigation.getParent()?.navigate('DashboardTab')}
            activeOpacity={0.8}
            accessibilityLabel="Back to Home Dashboard"
          >
            <Ionicons name="arrow-back" size={18} color={tc.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>History</Text>
            <Text style={[styles.headerSubtitle, { color: tc.textMuted }]}>
              {scopeSums.count} {scopeSums.count === 1 ? 'record' : 'records'}
            </Text>
          </View>
        </View>

        {/* Integrated Filter Trigger Button */}
        <TouchableOpacity
          style={[
            styles.filterTriggerBtn,
            {
              backgroundColor: activeFiltersCount > 0 ? `${theme.accentColor}22` : tc.card,
              borderColor: activeFiltersCount > 0 ? theme.accentColor : tc.cardBorder,
            },
          ]}
          onPress={handleOpenFilterModal}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeFiltersCount > 0 ? 'funnel' : 'options-outline'}
            size={18}
            color={activeFiltersCount > 0 ? theme.accentColor : tc.textPrimary}
          />
          <Text
            style={[
              styles.filterTriggerText,
              { color: activeFiltersCount > 0 ? theme.accentColor : tc.textPrimary },
            ]}
          >
            Filters
          </Text>
          {activeFiltersCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.accentColor }]}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── 2. Unified Search Bar ── */}
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

      {/* ── 3. Apple-Style Compact Segmented Control (All / Expense / Income) ── */}
      <View style={styles.segmentedWrapper}>
        <View style={[styles.segmentedContainer, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
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
                  styles.segmentButton,
                  isSelected && [
                    styles.segmentButtonActive,
                    { backgroundColor: tc.card, borderColor: theme.accentColor },
                  ],
                ]}
                onPress={() => {
                  hapticSelection();
                  setSelectedType(tab.key);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isSelected ? theme.accentColor : tc.textMuted },
                    isSelected && styles.segmentTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.segmentBadge,
                    { backgroundColor: isSelected ? `${theme.accentColor}22` : 'transparent' },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBadgeText,
                      { color: isSelected ? theme.accentColor : tc.textMuted },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── 4. Active Chips Row (Only visible when non-default filters applied) ── */}
      {(selectedMethod !== 'all' || sortBy !== 'newest' || searchQuery.trim()) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeChipsContainer}
        >
          {selectedMethod !== 'all' && selectedMethodOption && (
            <View style={[styles.activeTagChip, { backgroundColor: `${selectedMethodOption.color}1E`, borderColor: selectedMethodOption.color }]}>
              <Ionicons name={selectedMethodOption.icon as any} size={12} color={selectedMethodOption.color} />
              <Text style={[styles.activeTagText, { color: selectedMethodOption.color }]}>
                {selectedMethodOption.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedMethod('all')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={14} color={selectedMethodOption.color} />
              </TouchableOpacity>
            </View>
          )}

          {sortBy !== 'newest' && selectedSortOption && (
            <View style={[styles.activeTagChip, { backgroundColor: `${theme.accentColor}1E`, borderColor: theme.accentColor }]}>
              <Ionicons name={selectedSortOption.icon as any} size={12} color={theme.accentColor} />
              <Text style={[styles.activeTagText, { color: theme.accentColor }]}>
                {selectedSortOption.label}
              </Text>
              <TouchableOpacity onPress={() => setSortBy('newest')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={14} color={theme.accentColor} />
              </TouchableOpacity>
            </View>
          )}

          {searchQuery.trim() && (
            <View style={[styles.activeTagChip, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
              <Text style={[styles.activeTagText, { color: tc.textSecondary }]}>"{searchQuery}"</Text>
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={14} color={tc.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={handleResetAllFilters} style={styles.clearAllTextBtn}>
            <Text style={[styles.clearAllText, { color: theme.accentColor }]}>Clear all</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── 5. Transaction Feed List ── */}
      {grouped.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="document-text-outline"
            title="No Transactions Found"
            subtitle={
              selectedMethod !== 'all'
                ? `No ${selectedMethodOption?.label} transactions found.`
                : searchQuery
                ? 'No matching records found for this query.'
                : 'Add an expense or income to begin.'
            }
          />
          {(selectedMethod !== 'all' || selectedType !== 'all' || searchQuery.trim() || sortBy !== 'newest') && (
            <TouchableOpacity
              style={[styles.clearFiltersBtn, { backgroundColor: `${theme.accentColor}22`, borderColor: theme.accentColor }]}
              onPress={handleResetAllFilters}
            >
              <Ionicons name="close-circle-outline" size={16} color={theme.accentColor} />
              <Text style={[styles.clearFiltersBtnText, { color: theme.accentColor }]}>Reset All Filters</Text>
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

      {/* ── 6. Bottom Sheet Filter Modal ── */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsFilterModalOpen(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: tc.card,
                borderColor: tc.cardBorder,
                paddingBottom: insets.bottom + 20,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>Filter Transactions</Text>
                <Text style={[styles.modalSubtitle, { color: tc.textMuted }]}>
                  Refine by payment method and order
                </Text>
              </View>
              <TouchableOpacity onPress={handleResetModalFilters} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.modalResetText, { color: theme.accentColor }]}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              
              {/* Payment Methods */}
              <Text style={[styles.modalSectionTitle, { color: tc.textSecondary }]}>Payment Method</Text>
              <View style={styles.methodGrid}>
                {PAYMENT_METHOD_OPTIONS.map((opt) => {
                  const isSelected = draftMethod === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.methodGridItem,
                        {
                          backgroundColor: isSelected ? `${opt.color}22` : tc.surface,
                          borderColor: isSelected ? opt.color : tc.cardBorder,
                        },
                      ]}
                      onPress={() => {
                        hapticSelection();
                        setDraftMethod(opt.key);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={opt.icon as any} size={16} color={isSelected ? opt.color : tc.textMuted} />
                      <Text
                        style={[
                          styles.methodGridLabel,
                          { color: isSelected ? opt.color : tc.textSecondary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sort Options */}
              <Text style={[styles.modalSectionTitle, { color: tc.textSecondary, marginTop: 20 }]}>
                Sort By
              </Text>
              <View style={styles.sortOptionsCol}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = draftSort === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.sortRow,
                        {
                          backgroundColor: isSelected ? `${theme.accentColor}15` : tc.surface,
                          borderColor: isSelected ? theme.accentColor : tc.cardBorder,
                        },
                      ]}
                      onPress={() => {
                        hapticSelection();
                        setDraftSort(opt.key);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.sortLeft}>
                        <Ionicons
                          name={opt.icon as any}
                          size={18}
                          color={isSelected ? theme.accentColor : tc.textMuted}
                        />
                        <Text
                          style={[
                            styles.sortLabel,
                            { color: isSelected ? theme.accentColor : tc.textPrimary },
                            isSelected && { fontWeight: '700' },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          { borderColor: isSelected ? theme.accentColor : tc.cardBorder },
                        ]}
                      >
                        {isSelected && (
                          <View style={[styles.radioFill, { backgroundColor: theme.accentColor }]} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApplyFilters}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.accentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyBtnGrad}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Search
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Segmented Control
  segmentedWrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  segmentButtonActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '800',
  },
  segmentBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Active Chips
  activeChipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clearAllTextBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Transaction Feed
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderExpense: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCardList: {
    gap: 8,
  },

  // Cards
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
  txInfo: {
    flex: 1,
  },
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

  // Empty State
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

  // Modal Bottom Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalResetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Method Grid in Sheet
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodGridLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Sort Options
  sortOptionsCol: {
    gap: 8,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Apply Button
  applyBtn: {
    marginTop: 18,
    borderRadius: 14,
    overflow: 'hidden',
  },
  applyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
