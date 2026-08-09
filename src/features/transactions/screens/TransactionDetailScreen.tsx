import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HistoryStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { formatTransactionDate } from '../../../shared/utils/dateUtils';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { AppButton } from '../../../shared/components/AppButton';

type Props = {
  navigation: NativeStackNavigationProp<HistoryStackParamList, 'TransactionDetail'>;
  route: RouteProp<HistoryStackParamList, 'TransactionDetail'>;
};

export default function TransactionDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction } = useTransactions();
  const { settings } = useSettings();
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const transaction = transactions.find((t) => t.id === route.params.transactionId);

  if (!transaction) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Transaction Details" onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Transaction not found</Text>
        </View>
      </View>
    );
  }

  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? colors.expense : colors.income;

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(transaction.id);
            navigation.goBack();
          },
        },
      ]
    );
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
        {/* Main Card */}
        <View style={styles.card}>
          <View style={[styles.iconBg, { backgroundColor: `${transaction.categoryColorSnapshot}20` }]}>
            <Ionicons
              name={transaction.categoryIconSnapshot as any}
              size={32}
              color={transaction.categoryColorSnapshot}
            />
          </View>

          <Text style={styles.categoryTitle}>{transaction.categoryNameSnapshot}</Text>
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
            <Text style={styles.detailValue}>{transaction.paymentMethod.toUpperCase()}</Text>
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
            onPress={handleDelete}
            icon={<Ionicons name="trash-outline" size={18} color={colors.expense} />}
          />
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
