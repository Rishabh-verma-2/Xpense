import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useCategories } from '../../../context/CategoryContext';
import { useToast } from '../../../context/ToastContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { validateCategoryName } from '../../../shared/utils/validators';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { AppButton } from '../../../shared/components/AppButton';
import { useAppTheme } from '../../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'AddEditCategory'>;
  route: RouteProp<SettingsStackParamList, 'AddEditCategory'>;
};

const ICONS = [
  'fast-food-outline', 'car-outline', 'receipt-outline', 'bag-outline',
  'medkit-outline', 'game-controller-outline', 'book-outline', 'basket-outline',
  'briefcase-outline', 'laptop-outline', 'gift-outline', 'wallet-outline',
  'airplane-outline', 'fitness-outline', 'cart-outline', 'build-outline',
];

const COLORS = [
  '#F59E0B', '#3B82F6', '#EF4444', '#EC4899', '#10B981', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#D946EF', '#14B8A6',
];

export default function AddEditCategoryScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { categoryId } = route.params || {};
  const { categories, addCategory, updateCategory } = useCategories();
  const { showSuccess, showError } = useToast();
  const { theme } = useAppTheme();
  const tc = theme.colors;

  const existingCat = categories.find((c) => c.id === categoryId);

  const [name, setName] = useState(existingCat?.name ?? '');
  const [type, setType] = useState<'expense' | 'income'>(existingCat?.type ?? 'expense');
  const [selectedIcon, setSelectedIcon] = useState(existingCat?.icon ?? ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(existingCat?.color ?? COLORS[0]);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const val = validateCategoryName(name);
    if (!val.valid) {
      setError(val.error!);
      return;
    }
    setError('');

    try {
      if (existingCat) {
        await updateCategory(existingCat.id, {
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
        });
        showSuccess('Category Updated! ✏️', `"${name.trim()}" saved`);
      } else {
        await addCategory({
          name: name.trim(),
          type,
          icon: selectedIcon,
          color: selectedColor,
          isArchived: false,
          sortOrder: categories.length,
        });
        showSuccess('Category Created! 🏷️', `"${name.trim()}" added to ${type}s`);
      }
      navigation.goBack();
    } catch {
      showError('Error', 'Failed to save category');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader
        title={existingCat ? 'Edit Category' : 'New Category'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Name input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: tc.textMuted }]}>Category Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: tc.card, borderColor: tc.cardBorder, color: tc.textPrimary }, !!error && styles.inputError]}
            placeholder="e.g. Subscriptions"
            placeholderTextColor={tc.textMuted}
            value={name}
            onChangeText={setName}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Type selector (only if new) */}
        {!existingCat ? (
          <View style={styles.section}>
            <Text style={[styles.label, { color: tc.textMuted }]}>Type</Text>
            <View style={[styles.typeRow, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && [styles.typeBtnActive, { backgroundColor: theme.accentColor }]]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeText, { color: type === 'expense' ? '#FFFFFF' : tc.textSecondary }, type === 'expense' && styles.typeTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && [styles.typeBtnActive, { backgroundColor: theme.accentColor }]]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeText, { color: type === 'income' ? '#FFFFFF' : tc.textSecondary }, type === 'income' && styles.typeTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Icon picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: tc.textMuted }]}>Icon</Text>
          <View style={styles.grid}>
            {ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[
                  styles.iconBox,
                  { backgroundColor: tc.card, borderColor: tc.cardBorder },
                  selectedIcon === ic && { borderColor: selectedColor, backgroundColor: `${selectedColor}20` },
                ]}
                onPress={() => setSelectedIcon(ic)}
              >
                <Ionicons name={ic as any} size={22} color={selectedIcon === ic ? selectedColor : tc.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: tc.textMuted }]}>Color</Text>
          <View style={styles.grid}>
            {COLORS.map((cl) => (
              <TouchableOpacity
                key={cl}
                style={[styles.colorBox, { backgroundColor: cl }, selectedColor === cl && styles.colorBoxActive]}
                onPress={() => setSelectedColor(cl)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBtn}>
        <AppButton label="Save Category" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inputError: {
    borderColor: colors.expense,
  },
  errorText: {
    ...typography.caption,
    color: colors.expense,
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  typeBtnActive: {
    backgroundColor: colors.primaryMuted,
  },
  typeText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  typeTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  colorBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorBoxActive: {
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
  bottomBtn: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
  },
});
