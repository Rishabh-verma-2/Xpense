import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HistoryStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useCategories } from '../../../context/CategoryContext';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { CurrentMonthDatePickerModal } from '../../../shared/components/CurrentMonthDatePickerModal';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { PAYMENT_METHODS } from '../../../shared/constants/appConstants';
import { validateAmount, validateNotes } from '../../../shared/utils/validators';
import { PaymentMethod } from '../../../shared/types/transaction.types';
import { Category } from '../../../shared/types/category.types';
import { AppButton } from '../../../shared/components/AppButton';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

type Props = {
  navigation: NativeStackNavigationProp<HistoryStackParamList, 'EditTransaction'>;
  route: RouteProp<HistoryStackParamList, 'EditTransaction'>;
};

export default function EditTransactionScreen({ navigation, route }: Props) {
  const { transactionId } = route.params;
  const insets = useSafeAreaInsets();
  const { transactions, updateTransaction, deleteTransaction } = useTransactions();
  const { getByType } = useCategories();
  const { settings } = useSettings();
  const { showSuccess, showError, showInfo } = useToast();

  const transaction = transactions.find((t) => t.id === transactionId);
  if (!transaction) {
    navigation.goBack();
    return null;
  }

  const categories = getByType(transaction.type);
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const [amount, setAmount] = useState(transaction.amount.toFixed(2));
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    categories.find((c) => c.id === transaction.categoryId) ?? null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod);
  const [notes, setNotes] = useState(transaction.notes);
  const [date, setDate] = useState(transaction.date);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    const amountResult = validateAmount(amount);
    if (!amountResult.valid) newErrors.amount = amountResult.error!;
    if (!selectedCategory) newErrors.category = 'Please select a category';
    const notesResult = validateNotes(notes);
    if (!notesResult.valid) newErrors.notes = notesResult.error!;

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      await updateTransaction(transaction.id, {
        amount: parseFloat(amount),
        categoryId: selectedCategory!.id,
        categoryNameSnapshot: selectedCategory!.name,
        categoryIconSnapshot: selectedCategory!.icon,
        categoryColorSnapshot: selectedCategory!.color,
        paymentMethod,
        notes,
        date,
      });
      showSuccess('Transaction Saved! ✏️', `${selectedCategory!.name} updated`);
      navigation.goBack();
    } catch {
      showError('Error', "Couldn't update transaction.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      setShowDeleteModal(false);
      showInfo('Transaction Deleted 🗑️', 'The entry was removed.');
      navigation.popToTop();
    } catch {
      showError('Error', "Couldn't delete transaction.");
    } finally {
      setDeleting(false);
    }
  };

  const isExpense = transaction.type === 'expense';
  const accentColor = isExpense ? colors.expense : colors.income;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScreenHeader
          title="Edit Transaction"
          onBack={() => navigation.goBack()}
          rightAction={{ icon: 'trash-outline', onPress: () => setShowDeleteModal(true) }}
        />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Ionicons
              name={isExpense ? 'trending-down' : 'trending-up'}
              size={16}
              color={accentColor}
            />
            <Text style={[styles.typeBadgeText, { color: accentColor }]}>
              {isExpense ? 'Expense' : 'Income'}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Amount</Text>
            <View style={[styles.inputRow, errors.amount && styles.fieldError]}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
              />
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <TouchableOpacity
              style={[styles.pickerRow, errors.category && styles.fieldError]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              activeOpacity={0.8}
            >
              {selectedCategory ? (
                <>
                  <View style={[styles.catIcon, { backgroundColor: `${selectedCategory.color}25` }]}>
                    <Ionicons name={selectedCategory.icon as any} size={18} color={selectedCategory.color} />
                  </View>
                  <Text style={styles.pickerValue}>{selectedCategory.name}</Text>
                </>
              ) : (
                <Text style={styles.pickerPlaceholder}>Select category</Text>
              )}
              <Ionicons name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            {showCategoryPicker && (
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, selectedCategory?.id === cat.id && { borderColor: cat.color, backgroundColor: `${cat.color}15` }]}
                    onPress={() => { setSelectedCategory(cat); setShowCategoryPicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                    <Text style={[styles.catChipText, selectedCategory?.id === cat.id && { color: cat.color }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.key}
                  style={[styles.chip, paymentMethod === pm.key && styles.chipActive]}
                  onPress={() => setPaymentMethod(pm.key as PaymentMethod)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={pm.icon as any} size={15} color={paymentMethod === pm.key ? colors.primary : colors.textMuted} />
                  <Text style={[styles.chipText, paymentMethod === pm.key && { color: colors.primary }]}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Transaction Date (Current Month Only) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Transaction Date (Current Month Only)</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setShowDatePickerModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.catIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerValue}>
                  {new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <TextInput
              style={[styles.notesInput, errors.notes && styles.fieldError]}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
              multiline
            />
            {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
          </View>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        <View style={styles.saveRow}>
          <AppButton label="Update Transaction" onPress={handleSave} loading={loading} />
        </View>

        <CurrentMonthDatePickerModal
          visible={showDatePickerModal}
          selectedDateIso={date}
          onSelectDate={(newIso) => setDate(newIso)}
          onClose={() => setShowDatePickerModal(false)}
        />

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.card, alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.cardBorder,
  },
  typeBadgeText: { ...typography.caption },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg, gap: spacing.sm },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md,
  },
  currencySymbol: { ...typography.subheading, color: colors.textSecondary },
  amountInput: { flex: 1, ...typography.heading, color: colors.textPrimary, fontSize: 24 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md,
  },
  catIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  pickerValue: { flex: 1, ...typography.bodyMedium, color: colors.textPrimary },
  pickerPlaceholder: { flex: 1, ...typography.body, color: colors.textMuted },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  catChipText: { ...typography.caption, color: colors.textSecondary },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: `${colors.primary}60` },
  chipText: { ...typography.caption, color: colors.textMuted },
  notesInput: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md,
    ...typography.body, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top',
  },
  fieldError: { borderColor: colors.expense },
  errorText: { ...typography.caption, color: colors.expense },
  saveRow: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.background,
  },
});
