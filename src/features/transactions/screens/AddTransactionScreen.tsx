import React, { useState, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useTransactions } from '../../../context/TransactionContext';
import { useCategories } from '../../../context/CategoryContext';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { PAYMENT_METHODS } from '../../../shared/constants/appConstants';
import { validateAmount, validateDate, validateNotes } from '../../../shared/utils/validators';
import { TransactionType, PaymentMethod } from '../../../shared/types/transaction.types';
import { Category } from '../../../shared/types/category.types';
import { AppButton } from '../../../shared/components/AppButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddTransaction'>;
  route: RouteProp<RootStackParamList, 'AddTransaction'>;
};

const NUM_PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function AddTransactionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { addTransaction } = useTransactions();
  const { getByType } = useCategories();
  const { settings } = useSettings();

  const [type, setType] = useState<TransactionType>(route.params?.type ?? 'expense');
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categories = getByType(type);
  const currencySymbol = settings?.currencySymbol ?? '₹';

  // ── Numpad ───────────────────────────────────────────────────────────────
  const handleNumpad = useCallback((key: string) => {
    setAmount((prev) => {
      if (key === '⌫') {
        const next = prev.length > 1 ? prev.slice(0, -1) : '0';
        return next;
      }
      if (key === '.' && prev.includes('.')) return prev;
      if (prev === '0' && key !== '.') return key;
      if (prev.split('.')[1]?.length >= 2) return prev;
      return prev + key;
    });
  }, []);

  const switchType = (t: TransactionType) => {
    setType(t);
    setSelectedCategory(null);
  };

  // ── Validation + Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    const amountResult = validateAmount(amount);
    if (!amountResult.valid) newErrors.amount = amountResult.error!;

    if (!selectedCategory) newErrors.category = 'Please select a category';

    const notesResult = validateNotes(notes);
    if (!notesResult.valid) newErrors.notes = notesResult.error!;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        date,
        categoryId: selectedCategory!.id,
        categoryNameSnapshot: selectedCategory!.name,
        categoryIconSnapshot: selectedCategory!.icon,
        categoryColorSnapshot: selectedCategory!.color,
        paymentMethod,
        notes,
        isRecurring: false,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', "Couldn't save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isExpense = type === 'expense';
  const accentColor = isExpense ? colors.expense : colors.income;
  const accentMuted = isExpense ? colors.expenseMuted : colors.incomeMuted;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Transaction</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && { backgroundColor: t === 'expense' ? colors.expenseMuted : colors.incomeMuted }]}
              onPress={() => switchType(t)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={t === 'expense' ? 'trending-down' : 'trending-up'}
                size={16}
                color={type === t ? (t === 'expense' ? colors.expense : colors.income) : colors.textMuted}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  type === t && { color: t === 'expense' ? colors.expense : colors.income },
                ]}
              >
                {t === 'expense' ? 'Expense' : 'Income'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Amount Display */}
          <View style={styles.amountSection}>
            <Text style={styles.currencySymbol}>{currencySymbol}</Text>
            <Text style={[styles.amountDisplay, { color: accentColor }]}>
              {parseFloat(amount).toLocaleString('en-IN', {
                minimumFractionDigits: amount.includes('.') ? amount.split('.')[1].length : 0,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

          {/* Numpad */}
          <View style={styles.numpad}>
            {NUM_PAD.map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.numKey, key === '⌫' && styles.backspaceKey]}
                onPress={() => handleNumpad(key)}
                activeOpacity={0.6}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={22} color={colors.textSecondary} />
                ) : (
                  <Text style={styles.numKeyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
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
                    <Ionicons name={selectedCategory.icon as any} size={20} color={selectedCategory.color} />
                  </View>
                  <Text style={styles.pickerValue}>{selectedCategory.name}</Text>
                </>
              ) : (
                <>
                  <View style={[styles.catIcon, { backgroundColor: colors.card }]}>
                    <Ionicons name="apps-outline" size={20} color={colors.textMuted} />
                  </View>
                  <Text style={styles.pickerPlaceholder}>Select category</Text>
                </>
              )}
              <Ionicons
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

            {showCategoryPicker && (
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      selectedCategory?.id === cat.id && { borderColor: cat.color, backgroundColor: `${cat.color}15` },
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                    <Text style={[styles.catChipText, selectedCategory?.id === cat.id && { color: cat.color }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.key}
                  style={[styles.chip, paymentMethod === pm.key && styles.chipActive]}
                  onPress={() => setPaymentMethod(pm.key as PaymentMethod)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={pm.icon as any}
                    size={16}
                    color={paymentMethod === pm.key ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.chipText, paymentMethod === pm.key && styles.chipTextActive]}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes (optional)</Text>
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

        {/* Save Button */}
        <View style={styles.saveRow}>
          <AppButton label="Save Transaction" onPress={handleSave} loading={loading} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  typeToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  typeBtnText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    fontSize: 14,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  currencySymbol: {
    ...typography.displayMedium,
    color: colors.textSecondary,
    fontSize: 28,
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
    color: colors.textPrimary,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  numKey: {
    width: '30%',
    aspectRatio: 1.8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  backspaceKey: {
    backgroundColor: colors.expenseMuted,
    borderColor: `${colors.expense}20`,
  },
  numKeyText: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 22,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  fieldError: {
    borderColor: colors.expense,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerValue: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  pickerPlaceholder: {
    flex: 1,
    ...typography.body,
    color: colors.textMuted,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  catChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: `${colors.primary}60`,
  },
  chipText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    ...typography.caption,
    color: colors.expense,
    marginTop: -spacing.xs,
  },
  saveRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
  },
});
