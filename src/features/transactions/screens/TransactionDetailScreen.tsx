import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HistoryStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { formatTransactionDate } from '../../../shared/utils/dateUtils';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { useCategories } from '../../../context/CategoryContext';
import { useAppTheme } from '../../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<HistoryStackParamList, 'TransactionDetail'>;
  route: RouteProp<HistoryStackParamList, 'TransactionDetail'>;
};

export default function TransactionDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction } = useTransactions();
  const { getById } = useCategories();
  const { settings } = useSettings();
  const { showInfo, showError } = useToast();
  const { theme } = useAppTheme();
  const tc = theme.colors;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currencySymbol = settings?.currencySymbol ?? '₹';

  const transaction = transactions.find((t) => t.id === route.params.transactionId);

  if (!transaction) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScreenHeader title="Transaction Details" onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Transaction not found</Text>
        </View>
      </View>
    );
  }

  const isExpense = transaction.type === 'expense';
  const themeColor = isExpense ? '#F43F5E' : '#10B981';

  const cat = getById(transaction.categoryId);
  const catName = cat?.name || transaction.categoryNameSnapshot || 'General';
  const catIcon = cat?.icon || transaction.categoryIconSnapshot || (isExpense ? 'receipt-outline' : 'wallet-outline');
  const catColor = cat?.color || transaction.categoryColorSnapshot || themeColor;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      setShowDeleteModal(false);
      showInfo('Transaction Deleted 🗑️', 'The entry has been removed');
      navigation.goBack();
    } catch {
      showError('Error', "Couldn't delete transaction.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader
        title="Transaction Details"
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'create-outline',
          onPress: () => navigation.navigate('EditTransaction', { transactionId: transaction.id }),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Main Hero Card ── */}
        <View style={[styles.heroCard, { borderColor: `${themeColor}40` }]}>
          <LinearGradient
            colors={
              isExpense
                ? ['rgba(244, 63, 94, 0.22)', 'rgba(225, 29, 72, 0.06)', theme.mode === 'light' ? '#FFFFFF' : 'rgba(12, 8, 26, 0.95)']
                : ['rgba(16, 185, 129, 0.22)', 'rgba(5, 150, 105, 0.06)', theme.mode === 'light' ? '#FFFFFF' : 'rgba(12, 8, 26, 0.95)']
            }
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.iconBg, { backgroundColor: `${catColor}25` }]}>
              <Ionicons name={catIcon as any} size={34} color={catColor} />
            </View>

            <Text style={[styles.categoryTitle, { color: tc.textPrimary }]}>{catName}</Text>
            <Text style={[styles.amountText, { color: themeColor }]}>
              {isExpense ? '-' : '+'}{formatCurrency(transaction.amount, 'INR', currencySymbol)}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: `${themeColor}18`, borderColor: `${themeColor}33` }]}>
              <Text style={[styles.typeBadgeText, { color: themeColor }]}>
                {isExpense ? 'Expense Transaction' : 'Income Transaction'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Information Spec Sheet ── */}
        <View style={[styles.specSheetCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <View style={styles.specRow}>
            <View style={[styles.specIconWrap, { backgroundColor: `${theme.accentColor}22` }]}>
              <Ionicons name="calendar-outline" size={18} color={theme.accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.specLabel, { color: tc.textMuted }]}>Date & Time</Text>
              <Text style={[styles.specValue, { color: tc.textPrimary }]}>{formatTransactionDate(transaction.date)}</Text>
            </View>
          </View>

          <View style={[styles.specDivider, { backgroundColor: tc.cardBorder }]} />

          <View style={styles.specRow}>
            <View style={[styles.specIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="card-outline" size={18} color="#38BDF8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.specLabel, { color: tc.textMuted }]}>Payment Method</Text>
              <Text style={[styles.specValue, { color: tc.textPrimary }]}>{(transaction.paymentMethod || 'cash').toUpperCase()}</Text>
            </View>
          </View>

          <View style={[styles.specDivider, { backgroundColor: tc.cardBorder }]} />

          <View style={styles.specRow}>
            <View style={[styles.specIconWrap, { backgroundColor: `${catColor}20` }]}>
              <Ionicons name="pricetag-outline" size={18} color={catColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.specLabel, { color: tc.textMuted }]}>Category</Text>
              <Text style={[styles.specValue, { color: tc.textPrimary }]}>{catName}</Text>
            </View>
          </View>

          {transaction.notes ? (
            <>
              <View style={[styles.specDivider, { backgroundColor: tc.cardBorder }]} />
              <View style={styles.specRow}>
                <View style={[styles.specIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="document-text-outline" size={18} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.specLabel, { color: tc.textMuted }]}>Notes</Text>
                  <Text style={[styles.specValue, { color: tc.textPrimary }]}>{transaction.notes}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionBlock}>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: tc.card, borderWidth: 1, borderColor: tc.cardBorder, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}
            onPress={() => navigation.navigate('EditTransaction', { transactionId: transaction.id })}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color={theme.accentColor} />
            <Text style={[styles.editBtnText, { color: theme.accentColor }]}>Edit Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: `${tc.expense}15`, borderColor: `${tc.expense}40` }]}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={tc.expense} />
            <Text style={[styles.deleteBtnText, { color: tc.expense }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    backgroundColor: '#100C1F',
  },
  heroGradient: {
    padding: 24,
    alignItems: 'center',
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  typeBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Spec Sheet
  specSheetCard: {
    backgroundColor: '#120F20',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  specIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  notesValue: {
    fontSize: 13,
    color: '#E2E8F0',
    marginTop: 2,
    lineHeight: 18,
  },
  specDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 8,
  },

  // Action Block
  actionBlock: {
    gap: 10,
    marginTop: 8,
  },
  editBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  editBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F43F5E',
  },

  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
