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
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { useAppTheme } from '../../../context/ThemeContext';

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
    badgeColor: '#C084FC',
  },
  {
    type: 'bug',
    label: 'Bug Report',
    icon: 'bug-outline',
    placeholder: 'What happened? Describe the issue and steps to reproduce...',
    badgeColor: '#F43F5E',
  },
  {
    type: 'praise',
    label: 'Experience & Praise',
    icon: 'star-outline',
    placeholder: 'What do you love most about Xpense? Any suggestions to make it better?',
    badgeColor: '#F59E0B',
  },
  {
    type: 'question',
    label: 'Help / Question',
    icon: 'help-circle-outline',
    placeholder: 'What questions do you have about using Xpense or managing your data?',
    badgeColor: '#38BDF8',
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
  const { theme } = useAppTheme();
  const tc = theme.colors;

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
      const feedbackPayload = {
        id: `fb_${Date.now()}`,
        type: selectedType,
        rating,
        message: message.trim(),
        email: email.trim() || user?.email || 'Anonymous',
        userName: user?.name || 'User',
        platform: Platform.OS,
        appVersion: 'v2.4.0 (PWA)',
        timestamp: new Date().toISOString(),
      };

      const existingHistory = await AsyncStorage.getItem('@xpense_feedback_history');
      const parsed = existingHistory ? JSON.parse(existingHistory) : [];
      parsed.unshift(feedbackPayload);
      await AsyncStorage.setItem('@xpense_feedback_history', JSON.stringify(parsed.slice(0, 20)));

      await new Promise((resolve) => setTimeout(resolve, 600));

      setSubmitted(true);
      showSuccess('Feedback Submitted! 🎉', 'Thank you for helping us make Xpense better.');
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
              colors={['#241245', '#150A2E', '#0B0618']}
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
                  colors={['#7C3AED', '#6D28D9']}
                  style={styles.doneBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
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
      <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
        <ScreenHeader title="Send Feedback" onBack={() => navigation.goBack()} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Type Selector Pills ── */}
          <Text style={[styles.sectionLabel, { color: tc.textMuted }]}>FEEDBACK CATEGORY</Text>
          <View style={styles.typeGrid}>
            {FEEDBACK_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  style={[
                    styles.typeChip,
                    { backgroundColor: tc.card, borderColor: tc.cardBorder },
                    isSelected && {
                      backgroundColor: `${theme.accentColor}22`,
                      borderColor: theme.accentColor,
                    },
                  ]}
                  onPress={() => setSelectedType(opt.type)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={isSelected ? theme.accentColor : tc.textMuted}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: isSelected ? theme.accentColor : tc.textSecondary },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Star Rating ── */}
          <View style={[styles.ratingCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[styles.ratingTitle, { color: tc.textPrimary }]}>Rate your experience with Xpense</Text>
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
                    color={star <= rating ? '#F59E0B' : tc.cardBorder}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingLabel, { color: theme.accentColor }]}>{RATING_LABELS[rating]}</Text>
          </View>

          {/* ── Message Area ── */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeaderRow}>
              <Text style={[styles.inputLabel, { color: tc.textMuted }]}>YOUR MESSAGE</Text>
              <Text style={[styles.charCount, { color: tc.textMuted }]}>{message.length} / 1000</Text>
            </View>
            <TextInput
              style={[styles.textArea, { backgroundColor: tc.card, borderColor: tc.cardBorder, color: tc.textPrimary }]}
              placeholder={activeOption.placeholder}
              placeholderTextColor={tc.textMuted}
              multiline
              maxLength={1000}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          {/* ── Email Contact ── */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: tc.textMuted }]}>REPLY EMAIL (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: tc.card, borderColor: tc.cardBorder, color: tc.textPrimary }]}
              placeholder="your.email@example.com"
              placeholderTextColor={tc.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* ── Diagnostics Switch ── */}
          <View style={[styles.diagnosticsCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.diagnosticsInfo}>
              <Text style={[styles.diagnosticsTitle, { color: tc.textPrimary }]}>Include App & Device Diagnostics</Text>
              <Text style={[styles.diagnosticsSub, { color: tc.textMuted }]}>
                Helps pinpoint issues (v1.0.0 • {Platform.OS.toUpperCase()})
              </Text>
            </View>
            <Switch
              value={includeDiagnostics}
              onValueChange={setIncludeDiagnostics}
              trackColor={{ false: '#1A162B', true: `${theme.accentColor}55` }}
              thumbColor={includeDiagnostics ? theme.accentColor : '#64748B'}
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
              colors={theme.accentGradient}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
  flex: { flex: 1 },
  container: {
    flex: 1,
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Full clearance for floating bottom bar
    gap: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginLeft: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120F20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  typeChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Rating Card
  ratingCard: {
    backgroundColor: '#120F20',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  ratingTitle: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 2,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#C084FC',
    fontWeight: '800',
  },

  // Inputs
  inputGroup: {
    gap: 6,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  charCount: {
    fontSize: 10,
    color: '#64748B',
  },
  textArea: {
    backgroundColor: '#120F20',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FFFFFF',
    padding: 12,
    height: 110,
    fontSize: 13,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: '#120F20',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },

  // Diagnostics Card
  diagnosticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#120F20',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  diagnosticsInfo: {
    flex: 1,
  },
  diagnosticsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  diagnosticsSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Submit Button
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Success Screen
  successWrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  successCard: {
    borderRadius: 24,
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
    padding: 24,
    alignItems: 'center',
  },
  successIconBadge: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  doneBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  doneBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
