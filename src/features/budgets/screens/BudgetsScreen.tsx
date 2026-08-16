import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBudgets } from '../../../context/BudgetContext';
import { useTransactions } from '../../../context/TransactionContext';
import { useCategories } from '../../../context/CategoryContext';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { useAppTheme } from '../../../context/ThemeContext';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';
import { getMonthKey, getMonthLabel } from '../../../shared/utils/dateUtils';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { MonthSelector } from '../../../shared/components/MonthSelector';
import { computeBudgetProgress } from '../../reports/services/reportEngine';

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);
  const [monthKey, setMonthKey] = useState(getMonthKey(new Date()));
  const { budgets, upsertBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const { showSuccess, showWarning, showInfo, showError } = useToast();
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const progressList = useMemo(() => {
    return computeBudgetProgress(budgets, transactions, monthKey);
  }, [budgets, transactions, monthKey]);

  // Overall totals
  const overallStats = useMemo(() => {
    const totalBudget = progressList.reduce((s, p) => s + p.budget.amount, 0);
    const totalSpent = progressList.reduce((s, p) => s + p.spent, 0);
    const remaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Remaining daily burn pace
    const [y, m] = monthKey.split('-').map(Number);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
    const daysInMonth = new Date(y, m, 0).getDate();
    const daysLeft = isCurrentMonth ? Math.max(1, daysInMonth - now.getDate()) : daysInMonth;
    const dailyAllowance = remaining > 0 ? Math.round(remaining / daysLeft) : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentage,
      dailyAllowance,
      daysLeft,
    };
  }, [progressList, monthKey]);

  const handleSaveBudget = async () => {
    if (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid monthly budget limit.');
      return;
    }

    setSaving(true);
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
      showSuccess(
        'Budget Saved! 🎯',
        `Limit of ${currencySymbol}${Number(budgetAmount).toLocaleString()} set for ${getMonthLabel(monthKey)}`
      );
    } catch {
      showError('Error', "Couldn't save budget.");
    } finally {
      setSaving(false);
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

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingTop: topInset }]}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Budget Limits</Text>
          <Text style={[styles.headerSubtitle, { color: tc.textMuted }]}>{getMonthLabel(monthKey)}</Text>
        </View>

        <TouchableOpacity
          style={styles.newBudgetBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.accentGradient}
            style={styles.newBudgetGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.newBudgetText}>New Limit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Obsidian Budget Overview Hero Card ── */}
        {progressList.length > 0 ? (
          <View style={[styles.heroCard, { borderColor: theme.colors.cardBorderActive }]}>
            <LinearGradient
              colors={theme.heroGradient}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.specularLine} />

              <View style={styles.heroHeaderRow}>
                <Text style={styles.heroLabel}>MONTHLY BUDGET HEALTH</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        overallStats.percentage > 100
                          ? 'rgba(244, 63, 94, 0.2)'
                          : overallStats.percentage > 80
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                      borderColor:
                        overallStats.percentage > 100
                          ? 'rgba(244, 63, 94, 0.4)'
                          : overallStats.percentage > 80
                          ? 'rgba(245, 158, 11, 0.4)'
                          : 'rgba(16, 185, 129, 0.4)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          overallStats.percentage > 100
                            ? '#F43F5E'
                            : overallStats.percentage > 80
                            ? '#F59E0B'
                            : '#10B981',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          overallStats.percentage > 100
                            ? '#F43F5E'
                            : overallStats.percentage > 80
                            ? '#F59E0B'
                            : '#10B981',
                      },
                    ]}
                  >
                    {overallStats.percentage > 100
                      ? 'Over Budget'
                      : overallStats.percentage > 80
                      ? 'Caution Pace'
                      : 'Safe Pace'}{' '}
                    ({overallStats.percentage}%)
                  </Text>
                </View>
              </View>

              {/* Amount Main Row */}
              <View style={styles.amountsRow}>
                <View>
                  <Text style={styles.spentSubText}>Total Spent</Text>
                  <Text style={styles.heroAmountSpent}>
                    {formatCurrency(overallStats.totalSpent, 'INR', currencySymbol)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.spentSubText}>Total Budget</Text>
                  <Text style={styles.heroAmountTotal}>
                    {formatCurrency(overallStats.totalBudget, 'INR', currencySymbol)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.heroProgressBg}>
                <LinearGradient
                  colors={
                    overallStats.percentage > 100
                      ? ['#F43F5E', '#E11D48']
                      : overallStats.percentage > 80
                      ? ['#F59E0B', '#D97706']
                      : [theme.accentColor, tc.primaryDark]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.heroProgressFill,
                    { width: `${Math.min(100, Math.max(2, overallStats.percentage))}%` },
                  ]}
                />
              </View>

              {/* Summary Footer Line */}
              <View style={styles.heroFooter}>
                <Text style={styles.heroFooterText}>
                  {overallStats.remaining > 0 ? (
                    <>
                      <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>
                        {formatCurrency(overallStats.remaining, 'INR', currencySymbol)}
                      </Text>{' '}
                      left ({formatCurrency(overallStats.dailyAllowance, 'INR', currencySymbol)}/day for {overallStats.daysLeft}d)
                    </>
                  ) : (
                    <Text style={{ color: '#F43F5E', fontWeight: '800' }}>
                      Exceeded by {formatCurrency(Math.abs(overallStats.remaining), 'INR', currencySymbol)}
                    </Text>
                  )}
                </Text>
              </View>
            </LinearGradient>
          </View>
        ) : null}

        {/* ── Set Budget Inline Form / Modal Trigger ── */}
        {showAddModal && (
          <View style={[styles.addCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.addCardHeader}>
              <View style={[styles.addIconBg, { backgroundColor: tc.primaryMuted }]}>
                <Ionicons name="speedometer-outline" size={18} color={theme.accentColor} />
              </View>
              <Text style={[styles.addCardTitle, { color: tc.textPrimary }]}>Set Budget Limit</Text>
            </View>

            {/* Target Category Selector */}
            <Text style={[styles.formLabel, { color: tc.textMuted }]}>Target Scope</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              <TouchableOpacity
                style={[
                  styles.catChip,
                  { backgroundColor: tc.surface, borderColor: tc.cardBorder },
                  selectedCatId === null && { borderColor: theme.accentColor, backgroundColor: `${theme.accentColor}22` },
                ]}
                onPress={() => setSelectedCatId(null)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="wallet-outline"
                  size={14}
                  color={selectedCatId === null ? theme.accentColor : tc.textMuted}
                />
                <Text style={[styles.catChipText, { color: selectedCatId === null ? theme.accentColor : tc.textSecondary }, selectedCatId === null && styles.catChipTextActive]}>
                  Overall Monthly
                </Text>
              </TouchableOpacity>

              {expenseCategories.map((c) => {
                const isSelected = selectedCatId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.catChip,
                      { backgroundColor: tc.surface, borderColor: tc.cardBorder },
                      isSelected && { borderColor: theme.accentColor, backgroundColor: `${theme.accentColor}22` },
                    ]}
                    onPress={() => setSelectedCatId(c.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={c.icon as any}
                      size={14}
                      color={isSelected ? theme.accentColor : c.color}
                    />
                    <Text style={[styles.catChipText, { color: isSelected ? theme.accentColor : tc.textSecondary }, isSelected && styles.catChipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Amount Input with Presets */}
            <Text style={[styles.formLabel, { color: tc.textMuted }]}>Monthly Limit Amount</Text>
            <View style={[styles.inputRow, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
              <Text style={[styles.currencySymbol, { color: theme.accentColor }]}>{currencySymbol}</Text>
              <TextInput
                style={[styles.amountInput, { color: tc.textPrimary }]}
                placeholder="5000"
                placeholderTextColor={tc.textMuted}
                keyboardType="numeric"
                value={budgetAmount}
                onChangeText={setBudgetAmount}
              />
            </View>

            {/* Fast Presets */}
            <View style={styles.presetsRow}>
              {[2000, 5000, 10000, 25000].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}
                  onPress={() => setBudgetAmount(preset.toString())}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, { color: tc.textSecondary }]}>+{preset.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: tc.cardBorder }]}
                onPress={() => {
                  setShowAddModal(false);
                  setBudgetAmount('');
                  setSelectedCatId(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: tc.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveBudget}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={theme.accentGradient}
                  style={styles.saveBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save Budget</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Active Budget Cards List ── */}
        <View style={styles.budgetListSection}>
          <Text style={[styles.sectionHeaderTitle, { color: tc.textMuted }]}>ACTIVE BUDGET TARGETS</Text>

          {progressList.length === 0 && !showAddModal ? (
            <View style={[styles.emptyCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={[styles.emptyIconBg, { backgroundColor: tc.surface }]}>
                <Ionicons name="speedometer-outline" size={32} color={tc.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No Active Budgets</Text>
              <Text style={[styles.emptySub, { color: tc.textMuted }]}>
                Set spending limits to monitor your outflow and receive timely warnings.
              </Text>
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: `${theme.accentColor}22`, borderColor: theme.accentColor }]}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.emptyActionBtnText, { color: theme.accentColor }]}>Create Your First Budget</Text>
              </TouchableOpacity>
            </View>
          ) : (
            progressList.map((item) => {
              const cat = categories.find((c) => c.id === item.budget.categoryId);
              const catName = cat ? cat.name : 'Overall Monthly Budget';
              const catIcon = cat ? cat.icon : 'pie-chart-outline';
              const catColor = cat ? cat.color : theme.accentColor;
              const remaining = item.budget.amount - item.spent;
              const isOver = item.percentage >= 100;
              const isWarning = item.percentage >= 80 && !isOver;
              const barColor = isOver ? '#F43F5E' : isWarning ? '#F59E0B' : catColor;

              return (
                <View
                  key={item.budget.id}
                  style={[
                    styles.budgetItem,
                    { backgroundColor: tc.card, borderColor: tc.cardBorder },
                    isOver && { borderColor: 'rgba(244, 63, 94, 0.4)' },
                  ]}
                >
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetTitleRow}>
                      <View style={[styles.iconBg, { backgroundColor: `${catColor}22` }]}>
                        <Ionicons name={catIcon as any} size={18} color={catColor} />
                      </View>
                      <View>
                        <Text style={[styles.budgetName, { color: tc.textPrimary }]}>{catName}</Text>
                        <Text style={[styles.budgetRemainingText, { color: tc.textMuted }]}>
                          {remaining >= 0 ? (
                            <>
                              <Text style={{ fontWeight: '700', color: tc.textSecondary }}>
                                {formatCurrency(remaining, 'INR', currencySymbol)}
                              </Text>{' '}
                              remaining
                            </>
                          ) : (
                            <Text style={{ color: '#F43F5E', fontWeight: '700' }}>
                              Over by {formatCurrency(Math.abs(remaining), 'INR', currencySymbol)}
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCatId(item.budget.categoryId || null);
                          setBudgetAmount(item.budget.amount.toString());
                          setShowAddModal(true);
                        }}
                        style={styles.trashBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="pencil-outline" size={16} color={tc.textMuted} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setDeletingBudgetId(item.budget.id)}
                        style={styles.trashBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.progressBarBg, { backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)' }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(100, item.percentage)}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>

                  <View style={styles.budgetFooter}>
                    <Text style={[styles.spentText, { color: tc.textSecondary }]}>
                      <Text style={{ fontWeight: '800', color: tc.textPrimary }}>
                        {formatCurrency(item.spent, 'INR', currencySymbol)}
                      </Text>{' '}
                      / {formatCurrency(item.budget.amount, 'INR', currencySymbol)}
                    </Text>
                    <Text style={[styles.limitText, { color: barColor }]}>
                      {item.percentage}%
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
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
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  newBudgetBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  newBudgetGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newBudgetText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Safe padding for popped-out glass bottom bar
    gap: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  heroGradient: {
    padding: 18,
    position: 'relative',
  },
  specularLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#D8B4FE',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  spentSubText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  heroAmountSpent: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  heroAmountTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C084FC',
  },
  heroProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroFooterText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Add Card
  addCard: {
    backgroundColor: '#120F20',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  addCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  catRow: {
    gap: 8,
    marginBottom: 14,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#100C1F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#C084FC',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#100C1F',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '900',
    color: '#C084FC',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    padding: 0,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Active List
  budgetListSection: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  budgetItem: {
    backgroundColor: '#120F20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  budgetRemainingText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  trashBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spentText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  limitText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#120F20',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#C084FC',
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C084FC',
  },
});
