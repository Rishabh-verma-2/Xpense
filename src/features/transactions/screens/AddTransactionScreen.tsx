import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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
import { useAppTheme } from '../../../context/ThemeContext';

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
  const { theme } = useAppTheme();
  const tc = theme.colors;

  const [type, setType] = useState<TransactionType>(route.params?.type ?? 'expense');
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(true);

  // Per-Transaction Currency State
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
      const formattedAmount = `${selectedCurrencySymbol}${parseFloat(amount).toLocaleString()}`;
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
  const themeColor = isExpense ? '#F43F5E' : '#10B981';
  const themeBgMuted = isExpense ? 'rgba(244, 63, 94, 0.14)' : 'rgba(16, 185, 129, 0.14)';

  const parsedAmountNumber = parseFloat(amount) || 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
        {/* Top App Header */}
        <View style={[styles.header, { paddingTop: topInset + 6 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.closeBtn, { backgroundColor: tc.card, borderColor: tc.cardBorder }]} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={tc.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>New Transaction</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Segmented Glass Type Switcher ── */}
        <View style={[styles.typeSwitcherContainer, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <TouchableOpacity
            style={[styles.typeSwitcherTab, isExpense && styles.typeSwitcherTabActiveExpense]}
            onPress={() => switchType('expense')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up-circle"
              size={18}
              color={isExpense ? '#F43F5E' : tc.textMuted}
            />
            <Text style={[styles.typeSwitcherText, { color: isExpense ? '#F43F5E' : tc.textSecondary }, isExpense && styles.typeSwitcherTextActiveExpense]}>
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeSwitcherTab, !isExpense && styles.typeSwitcherTabActiveIncome]}
            onPress={() => switchType('income')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-down-circle"
              size={18}
              color={!isExpense ? '#10B981' : tc.textMuted}
            />
            <Text style={[styles.typeSwitcherText, { color: !isExpense ? '#10B981' : tc.textSecondary }, !isExpense && styles.typeSwitcherTextActiveIncome]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Titanium Amount Hero Card ── */}
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
              <View style={styles.amountHeaderRow}>
                <Text style={styles.amountLabel}>
                  {isExpense ? 'TOTAL OUTFLOW' : 'TOTAL INFLOW'}
                </Text>
                {/* Currency selector pill */}
                <TouchableOpacity
                  style={[styles.currencyBadge, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}
                  onPress={() => setShowCurrencyPicker(true)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.currencyBadgeText, { color: theme.accentColor }]}>{selectedCurrencyCode} ({selectedCurrencySymbol})</Text>
                  <Ionicons name="chevron-down" size={12} color={theme.accentColor} />
                </TouchableOpacity>
              </View>

              {/* Main Numbers */}
              <View style={styles.amountNumbersRow}>
                <Text style={[styles.currencyPrefix, { color: themeColor }]}>{currencySymbol}</Text>
                <Text style={[styles.amountHeroText, { color: tc.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                  {amount}
                </Text>
              </View>

              {/* Quick Amount Addition Chips */}
              <View style={styles.presetsRow}>
                {[100, 500, 1000, 2000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, { borderColor: `${themeColor}40`, backgroundColor: `${themeColor}14` }]}
                    onPress={() => {
                      const cur = parseFloat(amount) || 0;
                      setAmount((cur + preset).toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, { color: themeColor }]}>+{preset}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.clearChip, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}
                  onPress={() => setAmount('0')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.clearChipText, { color: tc.textMuted }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

          {/* ── Tactile Glass Numeric Keypad ── */}
          <View style={styles.numpadWrapper}>
            <View style={styles.numpadGrid}>
              {NUM_PAD.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.numKey, { backgroundColor: tc.card, borderColor: tc.cardBorder }, key === '⌫' && styles.backspaceKey]}
                  onPress={() => handleNumpad(key)}
                  activeOpacity={0.6}
                >
                  {key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={22} color={tc.textPrimary} />
                  ) : (
                    <Text style={[styles.numKeyText, { color: tc.textPrimary }]}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Category Selection ── */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowAddCatModal(true)}>
                <Text style={[styles.createCatText, { color: theme.accentColor }]}>+ Custom</Text>
              </TouchableOpacity>
            </View>

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
                    onPress={() => setSelectedCategory(cat)}
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

          {/* ── Payment Method Chips ── */}
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
                    onPress={() => setPaymentMethod(pm.key as PaymentMethod)}
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

          {/* ── Transaction Date Selector ── */}
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

          {/* ── Notes Input ── */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>Notes & Description (Optional)</Text>
            <View style={[styles.notesInputCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Ionicons name="create-outline" size={18} color={tc.textMuted} style={styles.notesIcon} />
              <TextInput
                style={[styles.notesTextInput, { color: tc.textPrimary }]}
                placeholder="What was this for? (e.g. Grocery store, dinner, invoice)"
                placeholderTextColor={tc.textMuted}
                value={notes}
                onChangeText={setNotes}
                maxLength={200}
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Floating Gradient Submit Button ── */}
        <View style={styles.floatingSaveBar}>
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
                    Save {isExpense ? 'Expense' : 'Income'} ({currencySymbol}{parsedAmountNumber.toLocaleString()})
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        <CurrentMonthDatePickerModal
          visible={showDatePickerModal}
          selectedDateIso={date}
          onSelectDate={(newDate) => {
            setDate(newDate);
            setShowDatePickerModal(false);
          }}
          onClose={() => setShowDatePickerModal(false)}
        />

        {/* ── Currency Selection Modal ── */}
        <Modal
          visible={showCurrencyPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCurrencyPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeading}>Select Currency</Text>
                <TouchableOpacity onPress={() => setShowCurrencyPicker(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {ALL_CURRENCIES.map((c) => {
                  const isSelected = selectedCurrencyCode === c.code;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.currencyRow, isSelected && styles.currencyRowActive]}
                      onPress={() => {
                        setSelectedCurrencySymbol(c.symbol);
                        setSelectedCurrencyCode(c.code);
                        setShowCurrencyPicker(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.currencySymbolCircle}>
                        <Text style={styles.currencySymbolCircleText}>{c.symbol}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.currencyNameText, isSelected && { color: '#C084FC', fontWeight: '800' }]}>
                          {c.name}
                        </Text>
                        <Text style={styles.currencyCodeSubText}>{c.code}</Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#C084FC" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Custom Category Creator Modal ── */}
        <Modal
          visible={showAddCatModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddCatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeading}>New Custom Category</Text>
                <TouchableOpacity onPress={() => setShowAddCatModal(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalTextInput}
                placeholder="Category Name (e.g. Pet Care, Subscriptions)"
                placeholderTextColor="#64748B"
                value={newCatName}
                onChangeText={setNewCatName}
                autoFocus
              />

              <Text style={styles.modalSubLabel}>Choose Color</Text>
              <View style={styles.modalColorsRow}>
                {QUICK_COLORS.map((clr) => (
                  <TouchableOpacity
                    key={clr}
                    style={[
                      styles.colorDot,
                      { backgroundColor: clr },
                      newCatColor === clr && styles.colorDotSelected,
                    ]}
                    onPress={() => setNewCatColor(clr)}
                  />
                ))}
              </View>

              <Text style={styles.modalSubLabel}>Choose Icon</Text>
              <View style={styles.modalIconsRow}>
                {QUICK_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[
                      styles.iconPill,
                      newCatIcon === ic && { borderColor: newCatColor, backgroundColor: `${newCatColor}22` },
                    ]}
                    onPress={() => setNewCatIcon(ic)}
                  >
                    <Ionicons name={ic as any} size={20} color={newCatIcon === ic ? newCatColor : '#94A3B8'} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateCustomCategory}
                disabled={creatingCategory}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.modalSubmitBtnGrad}>
                  {creatingCategory ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Create Category</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Type Switcher
  typeSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeSwitcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  typeSwitcherTabActiveExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  typeSwitcherTabActiveIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  typeSwitcherText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  typeSwitcherTextActiveExpense: {
    color: '#F43F5E',
    fontWeight: '800',
  },
  typeSwitcherTextActiveIncome: {
    color: '#10B981',
    fontWeight: '800',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },

  // Amount Card
  amountCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    marginBottom: 14,
    backgroundColor: '#100C1F',
  },
  amountGradient: {
    padding: 18,
  },
  amountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#94A3B8',
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  currencyBadgeText: {
    fontSize: 11,
    color: '#C084FC',
    fontWeight: '700',
  },
  amountNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  currencyPrefix: {
    fontSize: 34,
    fontWeight: '900',
    marginRight: 4,
  },
  amountHeroText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
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
  clearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Tactile Numpad
  numpadWrapper: {
    backgroundColor: '#100C1F',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  numKey: {
    width: '31%',
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  backspaceKey: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  numKeyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Sections
  sectionBlock: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  createCatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C084FC',
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

  // Payment Methods Row
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
  notesIcon: {
    marginRight: 8,
  },
  notesTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },

  // Floating Save Bar
  floatingSaveBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
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

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#131024',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  currencyRowActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  currencySymbolCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbolCircleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  currencyNameText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  currencyCodeSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  modalTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 14,
  },
  modalSubLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 8,
  },
  modalColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  modalIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalSubmitBtnGrad: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
