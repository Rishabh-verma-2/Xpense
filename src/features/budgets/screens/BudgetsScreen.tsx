import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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
import { useSavingsGoal } from '../../../context/SavingsGoalContext';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';
import { getMonthKey, getMonthLabel } from '../../../shared/utils/dateUtils';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { MonthSelector } from '../../../shared/components/MonthSelector';
import { computeBudgetProgress } from '../../reports/services/reportEngine';

const GOAL_EMOJIS = ['🎯', '🏠', '✈️', '💎', '🚗', '📱', '🎓', '💍', '🌴', '🏖️', '💰', '🚀'];

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

  // ── Tab state: Savings Goal is featured first ─────────────────────────────
  const [activeTab, setActiveTab] = useState<'goals' | 'budgets'>('goals');

  // ── Savings Goal from DB Context ──────────────────────────────────────────
  const { goal, setGoal, updateSavedAmount: updateGoalSavedAmount, deleteGoal } = useSavingsGoal();
  const [isEditingGoal, setIsEditingGoal] = useState(!goal);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalSavedAmount, setGoalSavedAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [goalSaving, setGoalSaving] = useState(false);
  const [quickAddAmount, setQuickAddAmount] = useState('');
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState(false);

  // Sync state when goal changes
  useEffect(() => {
    if (goal) {
      setGoalName(goal.name);
      setGoalTargetAmount(goal.targetAmount.toString());
      setGoalSavedAmount(goal.savedAmount.toString());
      setGoalTargetDate(goal.targetDate);
      setSelectedEmoji(goal.emoji || '🎯');
      setIsEditingGoal(false);
    } else {
      setIsEditingGoal(true);
      setGoalName('');
      setGoalTargetAmount('');
      setGoalSavedAmount('');
      setGoalTargetDate('');
    }
  }, [goal]);

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

  // Savings Goal calculations
  const goalProgress = useMemo(() => {
    if (!goal || goal.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
  }, [goal]);

  const goalDaysLeft = useMemo(() => {
    if (!goal) return 0;
    return Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000));
  }, [goal]);

  // Savings Goal Actions
  const handleSaveGoal = async () => {
    if (!goalName.trim()) {
      showWarning('Missing Name', 'Please enter a goal name.');
      return;
    }
    const target = parseFloat(goalTargetAmount);
    const saved = parseFloat(goalSavedAmount || '0');
    if (!target || target <= 0) {
      showWarning('Invalid Amount', 'Enter a valid target amount.');
      return;
    }
    if (!goalTargetDate) {
      showWarning('Missing Date', 'Please enter a target date (YYYY-MM-DD).');
      return;
    }

    setGoalSaving(true);
    try {
      await setGoal({
        name: goalName.trim(),
        targetAmount: target,
        savedAmount: Math.min(saved, target),
        targetDate: goalTargetDate,
        emoji: selectedEmoji,
      });
      showSuccess('Goal Saved! 🎯', `"${goalName.trim()}" goal stored in database.`);
      setIsEditingGoal(false);
    } catch {
      showError('Error', 'Could not save goal.');
    } finally {
      setGoalSaving(false);
    }
  };

  const handleUpdateGoalSaved = async () => {
    const amount = parseFloat(quickAddAmount);
    if (isNaN(amount) || amount < 0) {
      showWarning('Invalid Amount', 'Enter a valid saved amount.');
      return;
    }
    await updateGoalSavedAmount(amount);
    showSuccess('Progress Updated!', `You've saved ${formatCurrency(amount, 'INR', currencySymbol)} so far.`);
    setQuickAddAmount('');
  };

  const handleDeleteGoal = () => {
    setShowDeleteGoalModal(true);
  };

  const confirmDeleteGoal = async () => {
    setDeletingGoal(true);
    try {
      await deleteGoal();
      setShowDeleteGoalModal(false);
      setIsEditingGoal(true);
      setGoalName('');
      setGoalTargetAmount('');
      setGoalSavedAmount('');
      setGoalTargetDate('');
      showInfo('Goal Removed 🗑️', 'Savings goal deleted from cloud storage.');
    } catch {
      showError('Error', 'Could not delete savings goal.');
    } finally {
      setDeletingGoal(false);
    }
  };

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
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>
            {activeTab === 'goals' ? 'Savings Goal' : 'Budget Limits'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: tc.textMuted }]}>
            {activeTab === 'goals'
              ? goal
                ? `${goal.name} • ${goalProgress}% achieved`
                : 'Track your financial milestones'
              : getMonthLabel(monthKey)}
          </Text>
        </View>

        {activeTab === 'budgets' ? (
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
        ) : goal && !isEditingGoal ? (
          <TouchableOpacity
            style={[styles.deleteGoalTopBtn, { borderColor: 'rgba(244, 63, 94, 0.3)', backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}
            onPress={handleDeleteGoal}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color="#F43F5E" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Top Segmented Switcher (Savings Goal vs Budget Limits) ── */}
      <View style={styles.tabSwitchWrapper}>
        <View style={[styles.tabSwitchContainer, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'goals' && [
                styles.tabSwitchBtnActive,
                { backgroundColor: tc.card, borderColor: theme.accentColor },
              ],
            ]}
            onPress={() => setActiveTab('goals')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginRight: 5 }}>🎯</Text>
            <Text
              style={[
                styles.tabSwitchText,
                { color: activeTab === 'goals' ? theme.accentColor : tc.textMuted },
                activeTab === 'goals' && styles.tabSwitchTextActive,
              ]}
            >
              Savings Goal
            </Text>
            {goal && (
              <View style={[styles.tabGoalBadge, { backgroundColor: `${theme.accentColor}25` }]}>
                <Text style={[styles.tabGoalBadgeText, { color: theme.accentColor }]}>
                  {goalProgress}%
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              activeTab === 'budgets' && [
                styles.tabSwitchBtnActive,
                { backgroundColor: tc.card, borderColor: theme.accentColor },
              ],
            ]}
            onPress={() => setActiveTab('budgets')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="speedometer-outline"
              size={15}
              color={activeTab === 'budgets' ? theme.accentColor : tc.textMuted}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.tabSwitchText,
                { color: activeTab === 'budgets' ? theme.accentColor : tc.textMuted },
                activeTab === 'budgets' && styles.tabSwitchTextActive,
              ]}
            >
              Budget Limits
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: SAVINGS GOAL (Cloud DB Integrated)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'goals' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 1. Active Goal Hero Card */}
          {goal && !isEditingGoal ? (
            <>
              <LinearGradient
                colors={theme.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goalHeroCard}
              >
                <View style={styles.goalHeroTop}>
                  <View style={styles.goalEmojiCircle}>
                    <Text style={styles.goalEmojiText}>{goal.emoji || '🎯'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.goalHeroName}>{goal.name}</Text>
                    <Text style={styles.goalHeroSub}>
                      {goal.achieved ? '🎉 Milestone Achieved!' : `${goalDaysLeft} days remaining`}
                    </Text>
                  </View>
                  {goal.achieved && (
                    <View style={styles.achievedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                  )}
                </View>

                {/* Amounts Row */}
                <View style={styles.amountsRow}>
                  <View>
                    <Text style={styles.amountLabel}>Saved So Far</Text>
                    <Text style={styles.amountSaved}>
                      {formatCurrency(goal.savedAmount, 'INR', currencySymbol)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amountLabel}>Target Goal</Text>
                    <Text style={styles.amountTarget}>
                      {formatCurrency(goal.targetAmount, 'INR', currencySymbol)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, Math.max(3, goalProgress))}%`,
                        backgroundColor: goal.achieved ? '#10B981' : theme.accentColor,
                      },
                    ]}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.dbSyncPill}>☁️ Synced to MongoDB</Text>
                  <Text style={styles.progressPercent}>{goalProgress}% achieved</Text>
                </View>
              </LinearGradient>

              {/* Update Progress Card */}
              <View style={[styles.updateCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={[styles.updateLabel, { color: tc.textPrimary }]}>Update Saved Amount</Text>
                <Text style={[styles.updateSub, { color: tc.textMuted }]}>
                  Enter the updated amount you have accumulated towards this goal:
                </Text>

                <View style={[styles.inputRow, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                  <Text style={[styles.currencyPrefix, { color: theme.accentColor }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.amountInput, { color: tc.textPrimary }]}
                    placeholder={goal.savedAmount.toString()}
                    placeholderTextColor={tc.textMuted}
                    value={quickAddAmount}
                    onChangeText={setQuickAddAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Fast Presets */}
                <View style={styles.presetsRow}>
                  {[1000, 2500, 5000, 10000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.presetChip, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}
                      onPress={() => setQuickAddAmount((goal.savedAmount + preset).toString())}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetChipText, { color: tc.textSecondary }]}>
                        +{preset.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.updateBtn, { backgroundColor: theme.accentColor }]}
                  onPress={handleUpdateGoalSaved}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.updateBtnText, { color: theme.colors.textOnPrimary }]}>
                    Save Progress
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Edit Details Action */}
              <TouchableOpacity
                style={[styles.editGoalBtn, { borderColor: tc.cardBorder, backgroundColor: tc.card }]}
                onPress={() => setIsEditingGoal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color={theme.accentColor} />
                <Text style={[styles.editGoalBtnText, { color: theme.accentColor }]}>
                  Edit Goal Details
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* 2. Create / Edit Goal Form */
            <View style={[styles.formCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.formTitle, { color: tc.textPrimary }]}>
                  {goal ? 'Edit Savings Goal' : 'Create a Savings Goal'}
                </Text>
                <View style={[styles.dbBadge, { backgroundColor: `${theme.accentColor}20`, borderColor: theme.accentColor }]}>
                  <Text style={[styles.dbBadgeText, { color: theme.accentColor }]}>☁️ Cloud DB</Text>
                </View>
              </View>

              <Text style={[styles.formSub, { color: tc.textMuted }]}>
                Set a financial milestone. It is saved directly to your cloud database account.
              </Text>

              {/* Emoji Picker */}
              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Choose an Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
                {GOAL_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => setSelectedEmoji(e)}
                    style={[
                      styles.emojiBtn,
                      {
                        backgroundColor: selectedEmoji === e ? `${theme.accentColor}33` : tc.surface,
                        borderColor: selectedEmoji === e ? theme.accentColor : tc.cardBorder,
                      },
                    ]}
                  >
                    <Text style={styles.emojiBtnText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Goal Name */}
              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Goal Name</Text>
              <View style={[styles.textInputWrapper, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: tc.textPrimary }]}
                  placeholder="e.g. Emergency Fund, New Laptop, Vacation..."
                  placeholderTextColor={tc.textMuted}
                  value={goalName}
                  onChangeText={setGoalName}
                />
              </View>

              {/* Target Amount */}
              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>
                Target Amount ({currencySymbol})
              </Text>
              <View style={[styles.textInputWrapper, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: tc.textPrimary }]}
                  placeholder="Enter target (e.g. 50000)"
                  placeholderTextColor={tc.textMuted}
                  value={goalTargetAmount}
                  onChangeText={setGoalTargetAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Already Saved */}
              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>
                Already Saved ({currencySymbol})
              </Text>
              <View style={[styles.textInputWrapper, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: tc.textPrimary }]}
                  placeholder="Enter amount already saved (e.g. 0)"
                  placeholderTextColor={tc.textMuted}
                  value={goalSavedAmount}
                  onChangeText={setGoalSavedAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Target Date */}
              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>
                Target Date (YYYY-MM-DD)
              </Text>
              <View style={[styles.textInputWrapper, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: tc.textPrimary }]}
                  placeholder="YYYY-MM-DD (e.g. 2026-12-31)"
                  placeholderTextColor={tc.textMuted}
                  value={goalTargetDate}
                  onChangeText={setGoalTargetDate}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.formActions}>
                {goal && (
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: tc.cardBorder }]}
                    onPress={() => setIsEditingGoal(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: tc.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.accentColor, flex: goal ? 1 : undefined }]}
                  onPress={handleSaveGoal}
                  disabled={goalSaving}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={theme.accentGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtnGrad}
                  >
                    {goalSaving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                        <Text style={styles.saveBtnText}>Save Goal to Cloud</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Motivational Tip Card */}
          <View style={[styles.tipCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Ionicons name="bulb-outline" size={20} color={theme.accentColor} />
            <Text style={[styles.tipText, { color: tc.textSecondary }]}>
              💡 Your savings goal is synced with your account database and automatically tracks on your Home Dashboard.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: MONTHLY BUDGET LIMITS
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'budgets' && (
        <>
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
        </>
      )}

      {/* Delete Budget Confirmation Modal */}
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

      {/* Delete Savings Goal Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteGoalModal}
        title="Delete Savings Goal?"
        message="Are you sure you want to remove your savings goal? This will delete your target milestone from cloud database."
        confirmLabel="Delete Goal"
        isDestructive
        loading={deletingGoal}
        onConfirm={confirmDeleteGoal}
        onCancel={() => setShowDeleteGoalModal(false)}
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

  // ── Tab Switcher ──────────────────────────────────────────────────────────
  tabSwitchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  tabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabSwitchBtnActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  tabSwitchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabSwitchTextActive: {
    fontWeight: '800',
  },
  tabGoalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  tabGoalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  deleteGoalTopBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // ── Savings Goal Hero Card ────────────────────────────────────────────────
  goalHeroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  goalHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalEmojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  goalEmojiText: {
    fontSize: 26,
  },
  goalHeroName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  goalHeroSub: {
    fontSize: 12,
    color: 'rgba(233, 213, 255, 0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  achievedBadge: {
    padding: 4,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(233, 213, 255, 0.7)',
    marginBottom: 2,
  },
  amountSaved: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  amountTarget: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E9D5FF',
  },
  progressTrack: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  dbSyncPill: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(233, 213, 255, 0.75)',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Update Progress Card ──────────────────────────────────────────────────
  updateCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  updateLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  updateSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    paddingLeft: 14,
  },
  updateBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  editGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  editGoalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Form Card ─────────────────────────────────────────────────────────────
  formCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  dbBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  dbBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  formSub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emojiScroll: {
    marginBottom: 4,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  emojiBtnText: {
    fontSize: 20,
  },
  textInputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    fontSize: 14,
    paddingVertical: 2,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  // ── Motivational Tip Card ─────────────────────────────────────────────────
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
