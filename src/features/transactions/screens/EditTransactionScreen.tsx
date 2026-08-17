import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { useAppTheme } from '../../../context/ThemeContext';
import {
  hapticLight,
  hapticHeavy,
  hapticSelection,
  hapticSuccess,
  hapticError,
} from '../../../shared/utils/haptics';

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
  const { theme } = useAppTheme();
  const tc = theme.colors;

  const transaction = transactions.find((t) => t.id === transactionId);
  if (!transaction) {
    navigation.goBack();
    return null;
  }

  const categories = getByType(transaction.type);
  const currencySymbol = settings?.currencySymbol ?? '₹';

  // Find matching category with fallback strategies for older records
  const resolveCategory = (cats: Category[]): Category | null => {
    if (!cats || cats.length === 0) return null;
    // 1. By ID
    const byId = cats.find((c) => c.id === transaction.categoryId);
    if (byId) return byId;
    // 2. By Name
    const targetName = (transaction.categoryNameSnapshot || (transaction as any).categoryName || '').trim().toLowerCase();
    if (targetName) {
      const byName = cats.find((c) => c.name.trim().toLowerCase() === targetName);
      if (byName) return byName;
    }
    // 3. Fallback to first available category
    return cats[0] || null;
  };

  const [amount, setAmount] = useState(
    typeof transaction?.amount === 'number' && !isNaN(transaction.amount)
      ? transaction.amount.toString()
      : '0'
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    () => resolveCategory(categories)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod || 'cash');
  const [notes, setNotes] = useState(transaction.notes || '');
  const [date, setDate] = useState(transaction.date || new Date().toISOString());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-sync category if categories loaded asynchronously
  React.useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(resolveCategory(categories));
    }
  }, [categories, selectedCategory]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    const amountResult = validateAmount(amount);
    if (!amountResult.valid) newErrors.amount = amountResult.error!;

    const finalCategory = selectedCategory || resolveCategory(categories) || {
      id: transaction.categoryId || 'cat_general',
      name: transaction.categoryNameSnapshot || 'General',
      icon: transaction.categoryIconSnapshot || 'pricetag-outline',
      color: transaction.categoryColorSnapshot || '#7C3AED',
      type: transaction.type,
      isSystem: false,
      isArchived: false,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!finalCategory) newErrors.category = 'Please select a category';
    const notesResult = validateNotes(notes);
    if (!notesResult.valid) newErrors.notes = notesResult.error!;

    if (Object.keys(newErrors).length > 0) {
      hapticError();
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await updateTransaction(transaction.id, {
        amount: parseFloat(amount),
        categoryId: finalCategory.id,
        categoryNameSnapshot: finalCategory.name,
        categoryIconSnapshot: finalCategory.icon,
        categoryColorSnapshot: finalCategory.color,
        paymentMethod,
        notes,
        date,
      });
      hapticSuccess();
      showSuccess('Transaction Updated! ✏️', `${finalCategory.name} • ${currencySymbol}${parseFloat(amount).toLocaleString()}`);
      navigation.goBack();
    } catch (err: any) {
      hapticError();
      showError('Error', err?.message || "Couldn't update transaction.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      hapticHeavy();
      setShowDeleteModal(false);
      showInfo('Transaction Deleted 🗑️', 'The entry was removed.');
      navigation.popToTop();
    } catch {
      hapticError();
      showError('Error', "Couldn't delete transaction.");
    } finally {
      setDeleting(false);
    }
  };

  const isExpense = transaction.type === 'expense';
  const themeColor = isExpense ? '#F43F5E' : '#10B981';
  const parsedAmountNumber = parseFloat(amount) || 0;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
        <ScreenHeader
          title="Edit Transaction"
          onBack={() => navigation.goBack()}
          rightAction={{ icon: 'trash-outline', onPress: () => setShowDeleteModal(true) }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Type Tag Pill ── */}
          <View style={styles.typeBadgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: isExpense ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons
                name={isExpense ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={16}
                color={themeColor}
              />
              <Text style={[styles.typeBadgeText, { color: themeColor }]}>
                {isExpense ? 'Expense Entry' : 'Income Entry'}
              </Text>
            </View>
          </View>

          {/* ── Amount Display Card ── */}
          <View style={[styles.amountCard, { borderColor: `${themeColor}40` }]}>
            <LinearGradient
              colors={
                isExpense
                  ? ['rgba(244, 63, 94, 0.2)', 'rgba(225, 29, 72, 0.05)', theme.mode === 'light' ? '#FFFFFF' : 'rgba(12, 8, 26, 0.95)']
                  : ['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.05)', theme.mode === 'light' ? '#FFFFFF' : 'rgba(12, 8, 26, 0.95)']
              }
              style={styles.amountGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.amountLabel}>TRANSACTION AMOUNT</Text>

              <View style={styles.amountInputRow}>
                <Text style={[styles.currencyPrefix, { color: themeColor }]}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.amountTextInput, { color: tc.textPrimary }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor={tc.textMuted}
                  selectionColor={themeColor}
                />
              </View>

              {/* Quick Presets */}
              <View style={styles.presetsRow}>
                {[100, 500, 1000, 2000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, { borderColor: `${themeColor}40`, backgroundColor: `${themeColor}14` }]}
                    onPress={() => {
                      hapticLight();
                      const cur = parseFloat(amount) || 0;
                      setAmount((cur + preset).toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, { color: themeColor }]}>+{preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

          {/* ── Category Selection ── */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>Category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: tc.card, borderColor: tc.cardBorder },
                      isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}22` },
                    ]}
                    onPress={() => {
                      hapticSelection();
                      setSelectedCategory(cat);
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.catIconCircle,
                        { backgroundColor: isSelected ? cat.color : `${cat.color}22` },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={18}
                        color={isSelected ? '#FFFFFF' : cat.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryCardName,
                        { color: isSelected ? cat.color : tc.textSecondary },
                        isSelected && { fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* ── Payment Method ── */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentMethodsRow}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.key;
                return (
                  <TouchableOpacity
                    key={pm.key}
                    style={[
                      styles.paymentChip,
                      { backgroundColor: tc.card, borderColor: tc.cardBorder },
                      isSelected && { borderColor: theme.accentColor, backgroundColor: `${theme.accentColor}22` },
                    ]}
                    onPress={() => {
                      hapticSelection();
                      setPaymentMethod(pm.key as PaymentMethod);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={pm.icon as any}
                      size={15}
                      color={isSelected ? theme.accentColor : tc.textMuted}
                    />
                    <Text style={[styles.paymentChipText, { color: isSelected ? theme.accentColor : tc.textSecondary }, isSelected && styles.paymentChipTextActive]}>
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Date Selector ── */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>Transaction Date</Text>
            <TouchableOpacity
              style={[styles.dateSelectorRow, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
              onPress={() => setShowDatePickerModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.dateIconBg, { backgroundColor: `${theme.accentColor}22` }]}>
                <Ionicons name="calendar" size={18} color={theme.accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dateValueText, { color: tc.textPrimary }]}>
                  {new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={[styles.dateSubText, { color: tc.textMuted }]}>Tap to change</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tc.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Notes ── */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>Notes & Description</Text>
            <View style={[styles.notesInputCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Ionicons name="create-outline" size={18} color={tc.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.notesTextInput, { color: tc.textPrimary }]}
                placeholder="Add notes..."
                placeholderTextColor={tc.textMuted}
                value={notes}
                onChangeText={setNotes}
                maxLength={200}
              />
            </View>
          </View>

          {/* ── Save Action Button ── */}
          <View style={styles.saveBtnWrap}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  isExpense
                    ? ['#F43F5E', '#E11D48', '#BE123C']
                    : ['#10B981', '#059669', '#047857']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>
                      Update {isExpense ? 'Expense' : 'Income'} ({currencySymbol}{parsedAmountNumber.toLocaleString()})
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Date Picker Modal */}
        <CurrentMonthDatePickerModal
          visible={showDatePickerModal}
          selectedDateIso={date}
          restrictToCurrentMonth={false}
          onSelectDate={(newDate) => {
            setDate(newDate);
            setShowDatePickerModal(false);
          }}
          onClose={() => setShowDatePickerModal(false)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          visible={showDeleteModal}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          confirmLabel="Delete"
          isDestructive
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  typeBadgeRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Amount Card
  amountCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    marginBottom: 16,
    backgroundColor: '#100C1F',
  },
  amountGradient: {
    padding: 18,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#94A3B8',
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  currencyPrefix: {
    fontSize: 34,
    fontWeight: '900',
    marginRight: 4,
  },
  amountTextInput: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    padding: 0,
    minWidth: 120,
    textAlign: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Section
  sectionBlock: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.2,
    marginBottom: 8,
  },

  // Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31.5%',
    backgroundColor: '#100C1F',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  catIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Payment Methods
  paymentMethodsRow: {
    gap: 8,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#100C1F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  paymentChipActive: {
    borderColor: '#C084FC',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  paymentChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Date Row
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#100C1F',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  dateIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dateSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Notes
  notesInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#100C1F',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  notesTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },

  // Save Button Container (Cleared of bottom bar)
  saveBtnWrap: {
    marginTop: 10,
    marginBottom: 40,
  },
  saveButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  saveButtonGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 4,
  },
});
