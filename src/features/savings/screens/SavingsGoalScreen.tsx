import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { useAppTheme } from '../../../context/ThemeContext';
import { useSavingsGoal } from '../../../context/SavingsGoalContext';
import { useToast } from '../../../context/ToastContext';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { formatCurrency } from '../../../shared/utils/currencyUtils';
import { useSettings } from '../../../context/SettingsContext';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'SavingsGoal'>;
};

const GOAL_EMOJIS = ['🎯', '🏠', '✈️', '💎', '🚗', '📱', '🎓', '💍', '🌴', '🏖️', '💰', '🚀'];

export default function SavingsGoalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const { goal, setGoal, updateSavedAmount, deleteGoal } = useSavingsGoal();
  const { showSuccess, showError } = useToast();
  const { settings } = useSettings();
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const [isEditing, setIsEditing] = useState(!goal);
  const [name, setName] = useState(goal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() ?? '');
  const [savedAmount, setSavedAmount] = useState(goal?.savedAmount?.toString() ?? '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [selectedEmoji, setSelectedEmoji] = useState(goal?.emoji ?? '🎯');
  const [saving, setSaving] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const progressPercent =
    goal && goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
      : 0;

  const daysLeft = goal
    ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000))
    : 0;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent / 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const handleSave = async () => {
    if (!name.trim()) { showError('Missing Name', 'Please enter a goal name.'); return; }
    const target = parseFloat(targetAmount);
    const saved = parseFloat(savedAmount || '0');
    if (!target || target <= 0) { showError('Invalid Amount', 'Enter a valid target amount.'); return; }
    if (!targetDate) { showError('Missing Date', 'Please enter a target date (YYYY-MM-DD).'); return; }

    setSaving(true);
    try {
      await setGoal({
        name: name.trim(),
        targetAmount: target,
        savedAmount: Math.min(saved, target),
        targetDate,
        emoji: selectedEmoji,
      });
      showSuccess('Goal Saved! 🎯', `"${name.trim()}" goal is now active.`);
      setIsEditing(false);
    } catch {
      showError('Error', 'Could not save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSaved = async () => {
    const amount = parseFloat(savedAmount);
    if (isNaN(amount) || amount < 0) {
      showError('Invalid Amount', 'Enter a valid saved amount.');
      return;
    }
    await updateSavedAmount(amount);
    showSuccess('Progress Updated!', `You've saved ${formatCurrency(amount, 'INR', currencySymbol)} so far.`);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this savings goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGoal();
            showSuccess('Goal Deleted', 'Your savings goal has been removed.');
            setIsEditing(true);
            setName(''); setTargetAmount(''); setSavedAmount(''); setTargetDate('');
          },
        },
      ]
    );
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tc.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Smart Savings Goal"
        subtitle="Track your financial milestones"
        onBack={() => navigation.goBack()}
        rightAction={
          goal
            ? { icon: 'trash-outline', onPress: handleDelete, label: 'Delete' }
            : undefined
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Active Goal Display ── */}
          {goal && !isEditing && (
            <>
              {/* Hero Goal Card */}
              <LinearGradient
                colors={theme.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goalHeroCard}
              >
                <View style={styles.goalHeroTop}>
                  <View style={styles.goalEmojiCircle}>
                    <Text style={styles.goalEmojiText}>{goal.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.goalHeroName}>{goal.name}</Text>
                    <Text style={styles.goalHeroSub}>
                      {goal.achieved ? '🎉 Goal Achieved!' : `${daysLeft} days remaining`}
                    </Text>
                  </View>
                  {goal.achieved && (
                    <View style={styles.achievedBadge}>
                      <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    </View>
                  )}
                </View>

                {/* Progress Amounts */}
                <View style={styles.amountsRow}>
                  <View>
                    <Text style={styles.amountLabel}>Saved</Text>
                    <Text style={styles.amountSaved}>
                      {formatCurrency(goal.savedAmount, 'INR', currencySymbol)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amountLabel}>Target</Text>
                    <Text style={styles.amountTarget}>
                      {formatCurrency(goal.targetAmount, 'INR', currencySymbol)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressWidth,
                        backgroundColor: goal.achieved ? '#10B981' : theme.accentColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>{progressPercent}% achieved</Text>
              </LinearGradient>

              {/* Update Saved Amount */}
              <View style={[styles.updateCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={[styles.updateLabel, { color: tc.textPrimary }]}>Update Saved Amount</Text>
                <Text style={[styles.updateSub, { color: tc.textMuted }]}>
                  Enter how much you've saved towards this goal
                </Text>
                <View style={[styles.inputRow, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                  <Text style={[styles.currencyPrefix, { color: theme.accentColor }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.amountInput, { color: tc.textPrimary }]}
                    placeholder="0"
                    placeholderTextColor={tc.textMuted}
                    value={savedAmount}
                    onChangeText={setSavedAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.updateBtn, { backgroundColor: theme.accentColor }]}
                  onPress={handleUpdateSaved}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.updateBtnText, { color: theme.colors.textOnPrimary }]}>
                    Save Progress
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Edit Goal Button */}
              <TouchableOpacity
                style={[styles.editGoalBtn, { borderColor: tc.cardBorder, backgroundColor: tc.card }]}
                onPress={() => {
                  setName(goal.name);
                  setTargetAmount(goal.targetAmount.toString());
                  setSavedAmount(goal.savedAmount.toString());
                  setTargetDate(goal.targetDate);
                  setSelectedEmoji(goal.emoji);
                  setIsEditing(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color={theme.accentColor} />
                <Text style={[styles.editGoalBtnText, { color: theme.accentColor }]}>Edit Goal Details</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Create / Edit Form ── */}
          {isEditing && (
            <View style={[styles.formCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.formTitle, { color: tc.textPrimary }]}>
                {goal ? 'Edit Goal' : 'Create a New Goal'}
              </Text>
              <Text style={[styles.formSub, { color: tc.textMuted }]}>
                Set a financial target and track your journey to achieving it.
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
                        backgroundColor: selectedEmoji === e
                          ? `${theme.accentColor}33`
                          : tc.surface,
                        borderColor: selectedEmoji === e
                          ? theme.accentColor
                          : tc.cardBorder,
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
                  placeholder="e.g. Emergency Fund, Trip to Goa..."
                  placeholderTextColor={tc.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Target Amount */}
              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Target Amount ({currencySymbol})</Text>
              <View style={[styles.textInputWrapper, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: tc.textPrimary }]}
                  placeholder="50000"
                  placeholderTextColor={tc.textMuted}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Already Saved */}
              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Already Saved ({currencySymbol})</Text>
              <View style={[styles.textInputWrapper, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: tc.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={tc.textMuted}
                  value={savedAmount}
                  onChangeText={setSavedAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Target Date */}
              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Target Date (YYYY-MM-DD)</Text>
              <View style={[styles.textInputWrapper, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
                <TextInput
                  style={[styles.textInput, { color: tc.textPrimary }]}
                  placeholder="2025-12-31"
                  placeholderTextColor={tc.textMuted}
                  value={targetDate}
                  onChangeText={setTargetDate}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.formActions}>
                {goal && (
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: tc.cardBorder }]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: tc.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.accentColor, flex: goal ? 1 : undefined }]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={theme.accentGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtnGrad}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Goal'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tip Card */}
          {!goal && !isEditing && (
            <View style={[styles.tipCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Ionicons name="bulb-outline" size={20} color={theme.accentColor} />
              <Text style={[styles.tipText, { color: tc.textSecondary }]}>
                💡 Set a savings goal and it will appear on your Dashboard as a live progress widget.
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  goalHeroCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  goalHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalEmojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalEmojiText: { fontSize: 26 },
  goalHeroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  goalHeroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  achievedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountSaved: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  amountTarget: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textAlign: 'right',
  },
  updateCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  updateLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  updateSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 0,
  },
  updateBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  editGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  editGoalBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  formSub: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: -4,
  },
  textInputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
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
  emojiBtnText: { fontSize: 22 },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
