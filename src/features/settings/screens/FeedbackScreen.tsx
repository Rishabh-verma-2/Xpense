import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Feedback'>;
};

type FeedbackType = 'bug' | 'feature' | 'praise' | 'question';

interface FeedbackTypeOption {
  type: FeedbackType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  badgeColor: string;
}

const FEEDBACK_OPTIONS: FeedbackTypeOption[] = [
  {
    type: 'feature',
    label: 'Feature Request',
    icon: 'bulb-outline',
    placeholder: 'Describe the feature or improvement you would love to see in Xpense...',
    badgeColor: '#7C3AED',
  },
  {
    type: 'bug',
    label: 'Bug Report',
    icon: 'bug-outline',
    placeholder: 'What happened? Please describe the issue, what screen you were on, and steps to reproduce...',
    badgeColor: '#EF4444',
  },
  {
    type: 'praise',
    label: 'Experience & Praise',
    icon: 'star-outline',
    placeholder: 'What do you love most about Xpense? Any suggestions to make it even better?',
    badgeColor: '#F59E0B',
  },
  {
    type: 'question',
    label: 'Help / Question',
    icon: 'help-circle-outline',
    placeholder: 'What questions do you have about using Xpense or managing your data?',
    badgeColor: '#06B6D4',
  },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement 🙁',
  2: 'Fair 😐',
  3: 'Good 🙂',
  4: 'Great! 😊',
  5: 'Incredible Experience! 🚀',
};

export default function FeedbackScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [selectedType, setSelectedType] = useState<FeedbackType>('feature');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeOption = FEEDBACK_OPTIONS.find((o) => o.type === selectedType) || FEEDBACK_OPTIONS[0];

  const handleSubmit = async () => {
    if (!message.trim()) {
      showError('Message Required', 'Please enter a brief message before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      // Package feedback payload
      const feedbackPayload = {
        id: `fb_${Date.now()}`,
        type: selectedType,
        rating,
        message: message.trim(),
        email: email.trim() || user?.email || 'Anonymous',
        userName: user?.name || 'User',
        platform: Platform.OS,
        appVersion: 'v1.0.0 (PWA)',
        timestamp: new Date().toISOString(),
      };

      // Store in local storage history
      const existingHistory = await AsyncStorage.getItem('@xpense_feedback_history');
      const parsed = existingHistory ? JSON.parse(existingHistory) : [];
      parsed.unshift(feedbackPayload);
      await AsyncStorage.setItem('@xpense_feedback_history', JSON.stringify(parsed.slice(0, 20)));

      // Simulate network submission
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSubmitted(true);
      showSuccess(
        'Feedback Submitted! 🎉',
        'Thank you for helping us make Xpense the best expense tracker.'
      );
    } catch {
      showError('Submission Failed', 'Could not save feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScreenHeader title="Feedback Sent" onBack={() => navigation.goBack()} />
        <View style={styles.successWrapper}>
          <View style={styles.successCard}>
            <LinearGradient
              colors={['#2D1B69', '#1A0A4A', '#0F0B24']}
              style={styles.successGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.successIconBadge}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Thank You for Your Feedback! ❤️</Text>
              <Text style={styles.successSubtitle}>
                Your ideas and bug reports directly help us improve Xpense and build the features you love.
              </Text>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.doneBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.doneBtnText}>Back to Settings</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScreenHeader title="Send Feedback" onBack={() => navigation.goBack()} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Type Selector Pills ── */}
          <Text style={styles.sectionLabel}>WHAT IS THIS ABOUT?</Text>
          <View style={styles.typeGrid}>
            {FEEDBACK_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  style={[
                    styles.typeChip,
                    isSelected && {
                      backgroundColor: 'rgba(124, 58, 237, 0.18)',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedType(opt.type)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={isSelected ? colors.primaryLight : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      isSelected && { color: colors.primaryLight, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Star Rating ── */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Rate your experience with Xpense</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? '#F59E0B' : '#4B5563'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
          </View>

          {/* ── Message Area ── */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeaderRow}>
              <Text style={styles.inputLabel}>YOUR MESSAGE</Text>
              <Text style={styles.charCount}>{message.length} / 1000</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder={activeOption.placeholder}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          {/* ── Email Contact ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REPLY EMAIL (OPTIONAL)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="your.email@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* ── Diagnostics Switch ── */}
          <View style={styles.diagnosticsCard}>
            <View style={styles.diagnosticsInfo}>
              <Text style={styles.diagnosticsTitle}>Include App & Device Diagnostics</Text>
              <Text style={styles.diagnosticsSub}>
                Helps us pinpoint device issues (v1.0.0 • {Platform.OS.toUpperCase()})
              </Text>
            </View>
            <Switch
              value={includeDiagnostics}
              onValueChange={setIncludeDiagnostics}
              trackColor={{ false: colors.surface, true: colors.primaryMuted }}
              thumbColor={includeDiagnostics ? colors.primary : colors.textMuted}
            />
          </View>

          {/* ── Submit Button ── */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.submitText}>Submit Feedback</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 1.1,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  typeChipText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Rating Card
  ratingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  ratingTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 12,
  },

  // Inputs
  inputGroup: {
    gap: spacing.xs,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  charCount: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  textArea: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.textPrimary,
    padding: spacing.md,
    height: 120,
    fontSize: 14,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 14,
  },

  // Diagnostics Card
  diagnosticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  diagnosticsInfo: {
    flex: 1,
  },
  diagnosticsTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 13,
  },
  diagnosticsSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 11,
  },

  // Submit Button
  submitBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  submitText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Success Screen
  successWrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  successCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  successGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconBadge: {
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.heading,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    ...typography.body,
    color: 'rgba(229, 231, 235, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  doneBtn: {
    width: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  doneBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  doneBtnText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
