import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useTransactions } from '../../../context/TransactionContext';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { generateAndSharePDF, generateAndShareCSV, filterTransactionsByDateRange } from '../../../services/exportService';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Export'>;
};

type PresetKey = 'this_month' | 'last_30_days' | 'this_year' | 'all_time';

export default function ExportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { showSuccess, showWarning, showError } = useToast();

  const [preset, setPreset] = useState<PresetKey>('this_month');
  const [loadingType, setLoadingType] = useState<'pdf' | 'csv' | null>(null);

  const getDatesForPreset = (key: PresetKey): { startDate: string; endDate: string } => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (key) {
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        return { startDate: start, endDate: today };
      }
      case 'last_30_days': {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return { startDate: start, endDate: today };
      }
      case 'this_year': {
        const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        return { startDate: start, endDate: today };
      }
      case 'all_time':
      default: {
        return { startDate: '2020-01-01', endDate: today };
      }
    }
  };

  const { startDate, endDate } = getDatesForPreset(preset);
  const matchingTransactions = filterTransactionsByDateRange(transactions, startDate, endDate);

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (matchingTransactions.length === 0) {
      showWarning('No Data Found', 'There are no transactions in the selected date range.');
      return;
    }

    setLoadingType(format);
    try {
      const options = {
        startDate,
        endDate,
        format,
        currencySymbol: settings?.currencySymbol ?? '₹',
        userName: user?.name || 'Xpense User',
      };

      if (format === 'pdf') {
        await generateAndSharePDF(matchingTransactions, options);
      } else {
        await generateAndShareCSV(matchingTransactions, options);
      }

      showSuccess(
        'Export Ready! 🎉',
        `Successfully generated ${format.toUpperCase()} statement with ${matchingTransactions.length} records.`
      );
    } catch (err: any) {
      showError('Export Failed', err.message || 'Could not export financial statement.');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Export Reports" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preset Range Selector */}
        <Text style={styles.sectionTitle}>SELECT DATE RANGE</Text>
        <View style={styles.presetGrid}>
          {(
            [
              { key: 'this_month', label: 'This Month' },
              { key: 'last_30_days', label: 'Last 30 Days' },
              { key: 'this_year', label: 'This Year' },
              { key: 'all_time', label: 'All Time' },
            ] as const
          ).map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.presetChip, preset === item.key && styles.presetChipActive]}
              onPress={() => setPreset(item.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.presetText, preset === item.key && styles.presetTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Active Period</Text>
              <Text style={styles.summaryPeriod}>
                {startDate} → {endDate}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{matchingTransactions.length} Records</Text>
            </View>
          </View>
        </View>

        {/* PDF Export Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="document-text" size={24} color="#C084FC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>PDF Financial Statement</Text>
              <Text style={styles.actionDesc}>
                Executive-styled formatted report with KPI cards, category breakdown bars, and itemized ledger.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleExport('pdf')}
            disabled={loadingType !== null}
            activeOpacity={0.88}
          >
            {loadingType === 'pdf' ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="print-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Generate & Download PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CSV Export Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="grid-outline" size={24} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>CSV Spreadsheet</Text>
              <Text style={styles.actionDesc}>
                Raw data export formatted for Microsoft Excel, Google Sheets, or Apple Numbers.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#059669' }]}
            onPress={() => handleExport('csv')}
            disabled={loadingType !== null}
            activeOpacity={0.88}
          >
            {loadingType === 'csv' ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Export Raw CSV</Text>
              </>
            )}
          </TouchableOpacity>
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  presetChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: colors.primary,
  },
  presetText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#E9D5FF',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  summaryPeriod: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeText: {
    ...typography.caption,
    color: '#C084FC',
    fontWeight: '700',
    fontSize: 11,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 16,
  },
  actionDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  actionButton: {
    flexDirection: 'row',
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  actionButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
