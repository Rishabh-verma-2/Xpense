import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudgets } from '../../../context/BudgetContext';
import { useTransactions } from '../../../context/TransactionContext';
import { useCategories } from '../../../context/CategoryContext';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getMonthKey } from '../../../shared/utils/dateUtils';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { MonthSelector } from '../../../shared/components/MonthSelector';
import { computeBudgetProgress } from '../../reports/services/reportEngine';
import { AppButton } from '../../../shared/components/AppButton';

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const [monthKey, setMonthKey] = useState(getMonthKey(new Date()));
  const { budgets, upsertBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { showSuccess, showWarning, showInfo, showError } = useToast();
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const progressList = computeBudgetProgress(budgets, transactions, monthKey);

  const handleSaveBudget = async () => {
    if (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid monthly budget amount');
      return;
    }

    try {
      await upsertBudget({
        categoryId: selectedCatId,
        amount: Number(budgetAmount),
        month: monthKey,
        notifyAt70: true,
        notifyAt90: true,
        notifyAt100: true,
        carryForward: true,
      });

      setShowAddModal(false);
      setBudgetAmount('');
      setSelectedCatId(null);
      showSuccess('Budget Set! 🎯', `Limit of ${currencySymbol}${Number(budgetAmount).toLocaleString()} set for ${monthKey}`);
    } catch {
      showError('Error', "Couldn't save budget.");
    }
  };

  const confirmDeleteBudget = async () => {
    if (!deletingBudgetId) return;
    setDeleting(true);
    try {
      await deleteBudget(deletingBudgetId);
      setDeletingBudgetId(null);
      showInfo('Budget Removed 🗑️', 'The budget limit was deleted.');
    } catch {
      showError('Error', "Couldn't delete budget.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monthly Budgets</Text>
      </View>

      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Budget list */}
        {progressList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Budgets Set</Text>
            <Text style={styles.emptySub}>
              Set budgets for specific categories or an overall monthly spend limit.
            </Text>
          </View>
        ) : (
          progressList.map((item) => {
            const cat = categories.find((c) => c.id === item.budget.categoryId);
            const title = cat ? cat.name : 'Overall Monthly Budget';
            const icon = cat ? cat.icon : 'pie-chart-outline';
            const iconColor = cat ? cat.color : colors.primary;

            const barColor =
              item.status === 'danger'
                ? colors.expense
                : item.status === 'warning'
                ? colors.savings
                : colors.income;

            return (
              <View key={item.budget.id} style={styles.budgetItem}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetTitleRow}>
                    <View style={[styles.iconBg, { backgroundColor: `${iconColor}20` }]}>
                      <Ionicons name={icon as any} size={18} color={iconColor} />
                    </View>
                    <Text style={styles.budgetName}>{title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDeletingBudgetId(item.budget.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>

                <View style={styles.budgetFooter}>
                  <Text style={styles.spentText}>
                    Spent: {formatCurrency(item.spent, 'INR', currencySymbol)}
                  </Text>
                  <Text style={styles.limitText}>
                    Limit: {formatCurrency(item.budget.amount, 'INR', currencySymbol)} ({item.percentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* Set New Budget Button or Inline Form */}
        {!showAddModal ? (
          <AppButton
            label="Set New Budget"
            onPress={() => setShowAddModal(true)}
            icon={<Ionicons name="add" size={20} color="#FFF" />}
          />
        ) : (
          <View style={styles.addCard}>
            <Text style={styles.addCardTitle}>Set Budget for {monthKey}</Text>

            {/* Category Selector */}
            <Text style={styles.label}>Select Target:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              <TouchableOpacity
                style={[styles.catChip, selectedCatId === null && styles.catChipActive]}
                onPress={() => setSelectedCatId(null)}
              >
                <Text style={[styles.catChipText, selectedCatId === null && styles.catChipTextActive]}>
                  Overall Budget
                </Text>
              </TouchableOpacity>

              {categories
                .filter((c) => c.type === 'expense')
                .map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catChip, selectedCatId === c.id && styles.catChipActive]}
                    onPress={() => setSelectedCatId(c.id)}
                  >
                    <Ionicons name={c.icon as any} size={14} color={c.color} />
                    <Text style={[styles.catChipText, selectedCatId === c.id && styles.catChipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.label}>Monthly Amount:</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="5000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={budgetAmount}
                onChangeText={setBudgetAmount}
              />
            </View>

            <View style={styles.btnRow}>
              <View style={{ flex: 1 }}>
                <AppButton label="Cancel" variant="ghost" onPress={() => setShowAddModal(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton label="Save" onPress={handleSaveBudget} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!deletingBudgetId}
        title="Delete Budget?"
        message="Are you sure you want to remove this monthly budget limit?"
        confirmLabel="Delete"
        isDestructive
        loading={deleting}
        onConfirm={confirmDeleteBudget}
        onCancel={() => setDeletingBudgetId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  budgetItem: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spentText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  limitText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  addCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  addCardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  catRow: {
    gap: spacing.xs,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  catChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  catChipText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  catChipTextActive: {
    color: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
  },
  currencySymbol: {
    ...typography.subheading,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
