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
  Modal,
  ActivityIndicator,
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
import { useToast } from '../../../context/ToastContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';
import { PAYMENT_METHODS } from '../../../shared/constants/appConstants';
import { ALL_CURRENCIES } from '../../../shared/constants/currencies';
import { validateAmount, validateNotes } from '../../../shared/utils/validators';
import { TransactionType, PaymentMethod } from '../../../shared/types/transaction.types';
import { Category } from '../../../shared/types/category.types';
import { CurrentMonthDatePickerModal } from '../../../shared/components/CurrentMonthDatePickerModal';
import { AppButton } from '../../../shared/components/AppButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddTransaction'>;
  route: RouteProp<RootStackParamList, 'AddTransaction'>;
};

const NUM_PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

const QUICK_ICONS = [
  'pricetag-outline',
  'cart-outline',
  'fast-food-outline',
  'car-outline',
  'heart-outline',
  'sparkles-outline',
  'film-outline',
  'briefcase-outline',
  'home-outline',
  'cash-outline',
];

const QUICK_COLORS = [
  '#7C3AED',
  '#EF4444',
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
];

export default function AddTransactionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);
  const { addTransaction } = useTransactions();
  const { getByType, addCategory } = useCategories();
  const { settings } = useSettings();
  const { showSuccess, showError, showWarning } = useToast();

  const [type, setType] = useState<TransactionType>(route.params?.type ?? 'expense');
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Per-Transaction Currency State (Defaults to Indian Rupee ₹ / INR or User Settings)
  const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState(settings?.currencySymbol ?? '₹');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(settings?.currencyCode ?? 'INR');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Custom Category Creation State
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('pricetag-outline');
  const [newCatColor, setNewCatColor] = useState('#7C3AED');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const categories = getByType(type);
  const currencySymbol = selectedCurrencySymbol;

  const handleCreateCustomCategory = async () => {
    if (!newCatName.trim()) {
      showWarning('Category Name Required', 'Please enter a name for your custom category.');
      return;
    }

    setCreatingCategory(true);
    try {
      const created = await addCategory({
        name: newCatName.trim(),
        type,
        icon: newCatIcon,
        color: newCatColor,
        isArchived: false,
        sortOrder: categories.length,
      });

      setSelectedCategory(created);
      setShowAddCatModal(false);
      setNewCatName('');
      showSuccess('Category Created! 🏷️', `"${created.name}" created & selected`);
    } catch (err: any) {
      showError('Error', err.message || 'Failed to create category.');
    } finally {
      setCreatingCategory(false);
    }
  };

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
      const formattedAmount = `${settings?.currencySymbol ?? '₹'}${parseFloat(amount).toLocaleString()}`;
      showSuccess(
        `${type === 'expense' ? 'Expense' : 'Income'} Added! 🎉`,
        `${selectedCategory!.name} • ${formattedAmount}`
      );
      navigation.goBack();
    } catch {
      showError('Transaction Error', "Couldn't save transaction. Please try again.");
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
        <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
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

        {/* Top Prominent Date Picker Pill */}
        <TouchableOpacity
          style={styles.topDatePill}
          onPress={() => setShowDatePickerModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.topDatePillInner}>
            <Ionicons name="calendar" size={15} color={colors.primaryLight} />
            <Text style={styles.topDatePillText}>
              Date:{' '}
              <Text style={{ fontWeight: '800', color: colors.primaryLight }}>
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </Text>
            <Ionicons name="pencil" size={12} color={colors.primaryLight} style={{ marginLeft: 2 }} />
          </View>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Amount Display Hero Card */}
          <View style={[styles.amountCard, { borderColor: `${accentColor}40` }]}>
            <LinearGradient
              colors={
                isExpense
                  ? ['rgba(239, 68, 68, 0.18)', 'rgba(239, 68, 68, 0.04)', 'rgba(0,0,0,0)']
                  : ['rgba(16, 185, 129, 0.18)', 'rgba(16, 185, 129, 0.04)', 'rgba(0,0,0,0)']
              }
              style={styles.amountGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.amountLabel}>
                {isExpense ? 'ENTER EXPENSE AMOUNT' : 'ENTER INCOME AMOUNT'}
              </Text>

              <View style={styles.amountDisplayRow}>
                <TouchableOpacity
                  style={styles.currencyBadgeBtn}
                  onPress={() => setShowCurrencyPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.currencySymbol, { color: accentColor }]}>{selectedCurrencySymbol}</Text>
                  <Ionicons name="chevron-down" size={14} color={accentColor} style={{ marginLeft: 2, marginBottom: 4 }} />
                </TouchableOpacity>
                <Text style={[styles.amountDisplay, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
                  {parseFloat(amount).toLocaleString('en-IN', {
                    minimumFractionDigits: amount.includes('.') ? amount.split('.')[1].length : 0,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>

              {/* Quick Amount Presets */}
              <View style={styles.presetsRow}>
                {[100, 500, 1000, 2000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, { borderColor: `${accentColor}40`, backgroundColor: `${accentColor}12` }]}
                    onPress={() => {
                      const current = parseFloat(amount) || 0;
                      setAmount((current + preset).toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, { color: accentColor }]}>+{preset}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.clearPresetChip}
                  onPress={() => setAmount('0')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearPresetText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

          {/* Modern Numpad */}
          <View style={styles.numpadContainer}>
            <View style={styles.numpadGrid}>
              {NUM_PAD.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.numKey,
                    key === '⌫' && styles.backspaceKey,
                  ]}
                  onPress={() => handleNumpad(key)}
                  activeOpacity={0.65}
                >
                  {key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={24} color={colors.textSecondary} />
                  ) : (
                    <Text style={styles.numKeyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
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

                {/* + New Category Option */}
                <TouchableOpacity
                  style={styles.addCustomCatChip}
                  onPress={() => setShowAddCatModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={18} color={colors.primaryLight} />
                  <Text style={styles.addCustomCatChipText}>+ New Category</Text>
                </TouchableOpacity>
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

        <CurrentMonthDatePickerModal
          visible={showDatePickerModal}
          selectedDateIso={date}
          onSelectDate={(newIso) => setDate(newIso)}
          onClose={() => setShowDatePickerModal(false)}
        />

        {/* Save Button */}
        <View style={styles.saveRow}>
          <AppButton label="Save Transaction" onPress={handleSave} loading={loading} />
        </View>

        {/* Quick Add Custom Category Modal */}
        <Modal
          visible={showAddCatModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddCatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.catModalContainer}>
              <View style={styles.catModalHeader}>
                <Text style={styles.catModalTitle}>New {type === 'expense' ? 'Expense' : 'Income'} Category</Text>
                <TouchableOpacity onPress={() => setShowAddCatModal(false)}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.catNameInput}
                placeholder="e.g. Coffee, Rent, Crypto..."
                placeholderTextColor={colors.textMuted}
                value={newCatName}
                onChangeText={setNewCatName}
                maxLength={40}
                autoFocus
              />

              {/* Icon Picker */}
              <Text style={styles.pickerSublabel}>Choose Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                {QUICK_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[
                      styles.iconChip,
                      newCatIcon === ic && { backgroundColor: `${newCatColor}25`, borderColor: newCatColor },
                    ]}
                    onPress={() => setNewCatIcon(ic)}
                  >
                    <Ionicons name={ic as any} size={20} color={newCatIcon === ic ? newCatColor : colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Color Picker */}
              <Text style={styles.pickerSublabel}>Choose Color</Text>
              <View style={styles.colorRow}>
                {QUICK_COLORS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    style={[styles.colorDot, { backgroundColor: col }, newCatColor === col && styles.colorDotSelected]}
                    onPress={() => setNewCatColor(col)}
                  />
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowAddCatModal(false)}
                  disabled={creatingCategory}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveCatBtn, { backgroundColor: newCatColor }]}
                  onPress={handleCreateCustomCategory}
                  disabled={creatingCategory}
                  activeOpacity={0.88}
                >
                  {creatingCategory ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveCatBtnText}>Add & Select</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Per-Transaction Currency Selector Modal */}
        <Modal
          visible={showCurrencyPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCurrencyPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.catModalContainer}>
              <View style={styles.catModalHeader}>
                <Text style={styles.catModalTitle}>Transaction Currency</Text>
                <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {ALL_CURRENCIES.map((curr) => {
                  const isSel = selectedCurrencyCode === curr.code;
                  return (
                    <TouchableOpacity
                      key={curr.code}
                      style={[styles.currRow, isSel && styles.currRowSelected]}
                      onPress={() => {
                        setSelectedCurrencySymbol(curr.symbol);
                        setSelectedCurrencyCode(curr.code);
                        setShowCurrencyPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.currSymbolBg, isSel && { backgroundColor: `${accentColor}25` }]}>
                        <Text style={[styles.currSymbolText, { color: isSel ? accentColor : colors.textPrimary }]}>
                          {curr.symbol}
                        </Text>
                      </View>
                      <Text style={styles.currNameText}>
                        {curr.name} <Text style={{ color: colors.textMuted }}>({curr.code})</Text>
                      </Text>
                      {isSel && <Ionicons name="checkmark-circle" size={20} color={accentColor} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  // Amount Hero Card
  amountCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  amountGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.2,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 4,
    marginBottom: 6,
  },
  amountDisplay: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    width: '100%',
    paddingTop: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  presetText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
  },
  clearPresetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  clearPresetText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
  },

  // Numpad Container & Buttons
  numpadContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs + 2,
  },
  numKey: {
    width: '31%',
    height: 52,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  backspaceKey: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  numKeyText: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
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

  // Custom Category Chip
  addCustomCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  addCustomCatChipText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },

  // Custom Category Creation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  catModalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card || '#1E1E2D',
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder || 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  catModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  catModalTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 18,
  },
  catNameInput: {
    backgroundColor: colors.surface || '#12121A',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  pickerSublabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  iconScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.xs,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  saveCatBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCatBtnText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Currency Badge & Selector Styles
  currencyBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 6,
  },
  currRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  currRowSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  topDatePill: {
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  topDatePillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  topDatePillText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontSize: 12,
  },

  currSymbolBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currSymbolText: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  currNameText: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 14,
  },
});
