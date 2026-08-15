import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'HelpFaq'>;
};

interface FaqItem {
  id: string;
  category: 'budgets' | 'data' | 'categories' | 'offline';
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: '1',
    category: 'budgets',
    question: 'How do budget limits and alerts work?',
    answer:
      'You can set a monthly budget limit for individual categories (e.g., Food, Shopping) or set an overall monthly spend ceiling. The app visually highlights your progress: safe (green), cautionary (orange at >70%), and overbudget (red at >100%).',
  },
  {
    id: '2',
    category: 'budgets',
    question: 'How is the Savings Rate calculated?',
    answer:
      'Savings Rate = ((Total Monthly Income - Total Monthly Expenses) / Total Monthly Income) × 100%. If your total expenses exceed your income in a given month, your savings rate is reported as 0%.',
  },
  {
    id: '3',
    category: 'data',
    question: 'Is my financial data safe and private?',
    answer:
      'Yes! Your data is stored securely on your device and encrypted via secure JWT authentication when linked with cloud backup on MongoDB Atlas. We do not sell your personal financial data.',
  },
  {
    id: '4',
    category: 'data',
    question: 'How do I export my data to PDF or CSV?',
    answer:
      'Go to Settings > Data & Backup > Export Report. You can choose a date range (This Month, Last 3 Months, This Year, or Lifetime) and export clean CSV spreadsheets or formatted PDF statements with one tap.',
  },
  {
    id: '5',
    category: 'categories',
    question: 'Can I add custom categories with custom icons?',
    answer:
      'Yes! Navigate to Settings > Category Management. Tap the "+" button to create a new category, pick from 25+ icons, choose custom color palettes, and designate it as an Expense or Income category.',
  },
  {
    id: '6',
    category: 'categories',
    question: 'How do I change the default currency symbol?',
    answer:
      'Go to Settings > Currency. You can select from 30+ global currencies including INR (₹), USD ($), EUR (€), GBP (£), JPY (¥), AED (د.إ), and more.',
  },
  {
    id: '7',
    category: 'offline',
    question: 'Does Xpense work offline without internet?',
    answer:
      'Yes! Xpense is built with full offline-first capabilities. You can add, edit, and categorize transactions without internet connectivity. Changes automatically sync when you reconnect.',
  },
  {
    id: '8',
    category: 'data',
    question: 'How do I reset my app data if I want a fresh start?',
    answer:
      'In Settings > App Info > Reset Local App Data, you can permanently erase all local transactions, categories, and custom budgets to start with a blank slate.',
  },
];

export default function HelpFaqScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const q = searchQuery.toLowerCase().trim();
    return FAQS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Help & FAQs" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Box ── */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs (e.g., budget, export, currency)..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── FAQ List ── */}
        <View style={styles.faqList}>
          {filteredFaqs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No matching answers found</Text>
              <Text style={styles.emptySub}>
                Try searching for another topic or submit your question below.
              </Text>
            </View>
          ) : (
            filteredFaqs.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <View key={item.id} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={isExpanded ? colors.primaryLight : colors.textMuted}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.answerBlock}>
                      <Text style={styles.answerText}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ── Feedback Prompt Banner ── */}
        <View style={styles.feedbackBanner}>
          <LinearGradient
            colors={['#2D1B69', '#1A0A4A']}
            style={styles.feedbackGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.feedbackIconBadge}>
              <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.feedbackInfo}>
              <Text style={styles.feedbackTitle}>Need more help or have a suggestion?</Text>
              <Text style={styles.feedbackSub}>
                Send us a direct note or feature request. We read every submission!
              </Text>
            </View>
            <TouchableOpacity
              style={styles.feedbackBtn}
              onPress={() => navigation.navigate('Feedback')}
              activeOpacity={0.85}
            >
              <Text style={styles.feedbackBtnText}>Send Feedback</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
    fontSize: 14,
  },

  faqList: {
    gap: spacing.sm + 2,
  },
  faqCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.md,
  },
  questionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  answerBlock: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  answerText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  emptySub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Feedback Banner
  feedbackBanner: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    marginTop: spacing.xs,
  },
  feedbackGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  feedbackIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackInfo: {
    alignItems: 'center',
    gap: 4,
  },
  feedbackTitle: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  feedbackSub: {
    ...typography.caption,
    color: 'rgba(229, 231, 235, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  feedbackBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  feedbackBtnText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
