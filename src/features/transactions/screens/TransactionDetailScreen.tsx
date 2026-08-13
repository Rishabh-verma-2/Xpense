import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
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
import { AppButton } from '../../../shared/components/AppButton';
import { useCategories } from '../../../context/CategoryContext';

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
  const amountColor = isExpense ? colors.expense : colors.income;

  const cat = getById(transaction.categoryId);
  const catName = cat?.name || transaction.categoryNameSnapshot || 'General';
  const catIcon = cat?.icon || transaction.categoryIconSnapshot || (isExpense ? 'receipt-outline' : 'wallet-outline');
  const catColor = cat?.color || transaction.categoryColorSnapshot || (isExpense ? colors.expense : colors.income);

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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader
        title="Transaction Details"
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'create-outline',
          onPress: () => navigation.navigate('EditTransaction', { transactionId: transaction.id }),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Amount Card */}
        <View style={styles.card}>
          <View style={[styles.iconBg, { backgroundColor: `${catColor}20` }]}>
            <Ionicons
              name={catIcon as any}
              size={32}
              color={catColor}
            />
          </View>

          <Text style={styles.categoryTitle}>{catName}</Text>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {isExpense ? '-' : '+'}{formatCurrency(transaction.amount, 'INR', currencySymbol)}
          </Text>
          <Text style={styles.dateText}>{formatTransactionDate(transaction.date)}</Text>
        </View>

        {/* Details List */}
        <View style={styles.detailSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{isExpense ? 'Expense' : 'Income'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{(transaction.paymentMethod || 'cash').toUpperCase()}</Text>
          </View>

          {transaction.notes ? (
            <View style={styles.detailRowCol}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.notesValue}>{transaction.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionBlock}>
          <AppButton
            label="Delete Transaction"
            variant="danger"
            onPress={() => setShowDeleteModal(true)}
            icon={<Ionicons name="trash-outline" size={18} color={colors.expense} />}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...typography.body,
    color: colors.textMuted,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  categoryTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '700',
    marginVertical: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detailSection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowCol: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  notesValue: {
    ...typography.body,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  actionBlock: {
    marginTop: spacing.md,
  },
});
