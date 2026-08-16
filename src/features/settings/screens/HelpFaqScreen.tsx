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
import { useAppTheme } from '../../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'HelpFaq'>;
};

type FaqCategory = 'all' | 'budgets' | 'data' | 'categories' | 'offline';

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
      'You can set a monthly budget limit for individual categories (e.g., Food, Shopping) or set an overall monthly spend ceiling. The app visually highlights your progress: safe (green), cautionary (amber at >80%), and over budget (crimson at >100%).',
  },
  {
    id: '2',
    category: 'budgets',
    question: 'How is the Daily Allowance calculated?',
    answer:
      'Daily Allowance = Remaining Monthly Budget / Remaining Days in the Current Month. It automatically recalculates with every transaction to give you a dynamic spending pace.',
  },
  {
    id: '3',
    category: 'data',
    question: 'Is my financial data safe and private?',
    answer:
      'Yes! Your data is stored securely on your device and encrypted via secure JWT authentication when linked with cloud backup on MongoDB Atlas. We never sell or monetize your personal financial data.',
  },
  {
    id: '4',
    category: 'data',
    question: 'How do I export my data to PDF or CSV?',
    answer:
      'Go to Settings > Financial Preferences > Export Statement Hub. Choose from presets (All Time, This Month, Last 30/90 Days) or select custom dates to generate formatted PDF statements or CSV spreadsheets with one tap.',
  },
  {
    id: '5',
    category: 'categories',
    question: 'Can I add custom categories with custom icons?',
    answer:
      'Yes! When adding a transaction, tap "+ Custom Category" to create a new category with custom colors and icons, and designate it as an Expense or Income category.',
  },
  {
    id: '6',
    category: 'categories',
    question: 'How do I change the default currency symbol?',
    answer:
      'Go to Settings > Default Currency. You can select from 30+ global currencies including INR (₹), USD ($), EUR (€), GBP (£), JPY (¥), AED (د.إ), and more.',
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
      'In Settings > Danger Zone > Erase All App Data, you can permanently erase all local transactions and cached state to start fresh.',
  },
];

export default function HelpFaqScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((f) => {
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Help & FAQs" onBack={() => navigation.goBack()} />

      {/* ── Glass Search Box ── */}
      <View style={[styles.searchRow, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
        <Ionicons name="search-outline" size={18} color={tc.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: tc.textPrimary }]}
          placeholder="Search FAQs (budget, export, currency)..."
          placeholderTextColor={tc.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={tc.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Category Filter Pills ── */}
      <View style={styles.categoryPillsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsScroll}>
          {[
            { key: 'all' as const, label: 'All FAQs' },
            { key: 'budgets' as const, label: 'Budgets' },
            { key: 'data' as const, label: 'Data & Privacy' },
            { key: 'categories' as const, label: 'Categories' },
            { key: 'offline' as const, label: 'Offline Mode' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.catPill,
                  { backgroundColor: tc.card, borderColor: tc.cardBorder },
                  isSelected && {
                    borderColor: theme.accentColor,
                    backgroundColor: `${theme.accentColor}22`,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.catPillText,
                    { color: isSelected ? theme.accentColor : tc.textSecondary },
                    isSelected && styles.catPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── FAQ Accordion List ── */}
        <View style={styles.faqList}>
          {filteredFaqs.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Ionicons name="help-circle-outline" size={36} color={tc.textMuted} />
              <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No matching answers found</Text>
              <Text style={[styles.emptySub, { color: tc.textSecondary }]}>
                Try another search query or submit your question directly to support.
              </Text>
            </View>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;

              return (
                <TouchableOpacity
                  key={faq.id}
                  style={[
                    styles.faqCard,
                    { backgroundColor: tc.card, borderColor: tc.cardBorder },
                    isExpanded && { borderColor: theme.accentColor },
                  ]}
                  onPress={() => toggleExpand(faq.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.questionRow}>
                      <View style={[styles.qDot, { backgroundColor: isExpanded ? theme.accentColor : tc.cardBorder }]} />
                      <Text style={[styles.questionText, { color: tc.textPrimary }, isExpanded && { color: theme.accentColor }]}>
                        {faq.question}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isExpanded ? theme.accentColor : tc.textMuted}
                    />
                  </View>

                  {isExpanded && (
                    <View style={styles.answerContainer}>
                      <View style={[styles.answerDivider, { backgroundColor: tc.cardBorder }]} />
                      <Text style={[styles.answerText, { color: tc.textSecondary }]}>{faq.answer}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Contact Support Callout Card ── */}
        <View style={[styles.contactCard, { borderColor: theme.colors.cardBorderActive }]}>
          <LinearGradient
            colors={theme.heroGradient}
            style={styles.contactGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.contactIconBg}>
              <Ionicons name="chatbubbles-outline" size={24} color="#C084FC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Still have questions?</Text>
              <Text style={styles.contactSubtitle}>Send us your question or feature idea directly.</Text>
            </View>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => navigation.navigate('Feedback')}
              activeOpacity={0.85}
            >
              <Text style={styles.contactBtnText}>Ask Us</Text>
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
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120F20',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  categoryPillsRow: {
    marginBottom: 12,
  },
  categoryPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#120F20',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catPillActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#C084FC',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Full clearance for floating bottom bar
    gap: 16,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#120F20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  faqCardExpanded: {
    borderColor: 'rgba(192, 132, 252, 0.3)',
    backgroundColor: '#141026',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  qDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  qDotActive: {
    backgroundColor: '#C084FC',
  },
  questionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#CBD5E1',
    lineHeight: 18,
  },
  questionTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  answerContainer: {
    marginTop: 10,
  },
  answerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  answerText: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: '#120F20',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  contactCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  contactIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contactSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  contactBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
