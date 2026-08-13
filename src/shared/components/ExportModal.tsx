import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../core/theme';
import { useTransactions } from '../../context/TransactionContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  filterTransactionsByDateRange,
  generateAndSharePDF,
  generateAndShareCSV,
} from '../../services/exportService';

type PresetKey = 'this_month' | 'last_30_days' | 'last_90_days' | 'this_year' | 'all_time' | 'custom';

interface Props {
  visible: boolean;
  onClose: () => void;
}

import { Animated } from 'react-native';

export function ExportModal({ visible, onClose }: Props) {
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { showSuccess, showWarning, showError } = useToast();

  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, fadeAnim, scaleAnim]);

  const [preset, setPreset] = useState<PresetKey>('this_month');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [loading, setLoading] = useState(false);

  // Helper to format Date to YYYY-MM-DD
  const formatDateString = (d: Date) => d.toISOString().split('T')[0];

  // Derive initial dates based on preset
  const defaultDates = useMemo(() => {
    const now = new Date();
    const today = formatDateString(now);

    switch (preset) {
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: formatDateString(start), end: today };
      }
      case 'last_30_days': {
        const start = new Date();
        start.setDate(now.getDate() - 30);
        return { start: formatDateString(start), end: today };
      }
      case 'last_90_days': {
        const start = new Date();
        start.setDate(now.getDate() - 90);
        return { start: formatDateString(start), end: today };
      }
      case 'this_year': {
        const start = new Date(now.getFullYear(), 0, 1);
        return { start: formatDateString(start), end: today };
      }
      case 'all_time': {
        return { start: '2020-01-01', end: today };
      }
      default: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: formatDateString(start), end: today };
      }
    }
  }, [preset]);

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  // Sync custom start/end when preset changes
  const handlePresetSelect = (p: PresetKey) => {
    setPreset(p);
    const now = new Date();
    const today = formatDateString(now);

    if (p === 'this_month') {
      setStartDate(formatDateString(new Date(now.getFullYear(), now.getMonth(), 1)));
      setEndDate(today);
    } else if (p === 'last_30_days') {
      const s = new Date();
      s.setDate(now.getDate() - 30);
      setStartDate(formatDateString(s));
      setEndDate(today);
    } else if (p === 'last_90_days') {
      const s = new Date();
      s.setDate(now.getDate() - 90);
      setStartDate(formatDateString(s));
      setEndDate(today);
    } else if (p === 'this_year') {
      setStartDate(formatDateString(new Date(now.getFullYear(), 0, 1)));
      setEndDate(today);
    } else if (p === 'all_time') {
      setStartDate('2020-01-01');
      setEndDate(today);
    }
  };

  // Preview matching transactions count
  const matchingTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, startDate, endDate);
  }, [transactions, startDate, endDate]);

  const handleExport = async () => {
    if (!startDate.trim() || !endDate.trim()) {
      showWarning('Date Range Required', 'Please enter valid start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showWarning('Invalid Range', 'Start date cannot be after end date.');
      return;
    }

    if (matchingTransactions.length === 0) {
      showWarning('No Transactions', 'No transactions found for the selected date range.');
      return;
    }

    setLoading(true);
    try {
      const options = {
        startDate,
        endDate,
        format: exportFormat,
        currencySymbol: settings?.currencySymbol ?? '₹',
        userName: user?.name || 'Xpense User',
      };

      if (exportFormat === 'pdf') {
        await generateAndSharePDF(matchingTransactions, options);
      } else {
        await generateAndShareCSV(matchingTransactions, options);
      }

      showSuccess(
        'Export Complete 🎉',
        `Exported ${matchingTransactions.length} records as ${exportFormat.toUpperCase()}.`
      );
      onClose();
    } catch (err: any) {
      showError('Export Failed', err.message || 'An error occurred while generating report.');
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <Modal visible={showModal} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBg}>
                <Ionicons name="document-text" size={20} color={colors.primaryLight} />
              </View>
              <Text style={styles.title}>Export Financial Report</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Format Selection */}
            <Text style={styles.sectionLabel}>CHOOSE FORMAT</Text>
            <View style={styles.formatRow}>
              <TouchableOpacity
                style={[styles.formatCard, exportFormat === 'pdf' && styles.formatCardActive]}
                onPress={() => setExportFormat('pdf')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="document-text"
                  size={24}
                  color={exportFormat === 'pdf' ? colors.primaryLight : colors.textMuted}
                />
                <Text style={[styles.formatText, exportFormat === 'pdf' && styles.formatTextActive]}>
                  PDF Statement
                </Text>
                <Text style={styles.formatSub}>Formatted PDF Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatCard, exportFormat === 'csv' && styles.formatCardActive]}
                onPress={() => setExportFormat('csv')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="stats-chart"
                  size={24}
                  color={exportFormat === 'csv' ? colors.primaryLight : colors.textMuted}
                />
                <Text style={[styles.formatText, exportFormat === 'csv' && styles.formatTextActive]}>
                  CSV Spreadsheet
                </Text>
                <Text style={styles.formatSub}>Raw Excel / CSV Data</Text>
              </TouchableOpacity>
            </View>

            {/* Date Range Presets */}
            <Text style={styles.sectionLabel}>DATE RANGE PRESETS</Text>
            <View style={styles.presetGrid}>
              {[
                { key: 'this_month', label: 'This Month' },
                { key: 'last_30_days', label: 'Last 30 Days' },
                { key: 'last_90_days', label: 'Last 90 Days' },
                { key: 'this_year', label: 'This Year' },
                { key: 'all_time', label: 'All Time' },
                { key: 'custom', label: 'Custom' },
              ].map((p) => {
                const isSelected = preset === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => handlePresetSelect(p.key as PresetKey)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date Pickers / Custom Inputs */}
            <Text style={styles.sectionLabel}>SPECIFY DATES (YYYY-MM-DD)</Text>
            <View style={styles.datesRow}>
              <View style={styles.dateCol}>
                <Text style={styles.inputLabel}>From Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={startDate}
                  onChangeText={(val) => {
                    setStartDate(val);
                    setPreset('custom');
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View style={styles.dateCol}>
                <Text style={styles.inputLabel}>To Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={endDate}
                  onChangeText={(val) => {
                    setEndDate(val);
                    setPreset('custom');
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Preview Matching Badge */}
            <View style={styles.previewBadge}>
              <Ionicons name="filter" size={16} color={colors.primaryLight} />
              <Text style={styles.previewBadgeText}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                  {matchingTransactions.length}
                </Text>{' '}
                transactions found in selected range
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExport}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#FFF" />
                  <Text style={styles.exportText}>
                    Export {exportFormat.toUpperCase()}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: colors.card || '#1E1E2D',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconBg: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 17,
  },
  scrollContent: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1,
    fontSize: 11,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  formatRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  formatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    gap: spacing.xs,
  },
  formatCardActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
    borderColor: colors.primary,
  },
  formatText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 13,
  },
  formatTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  formatSub: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  presetChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  datesRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateCol: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: colors.surface || '#12121A',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontSize: 14,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  previewBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  exportBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  exportText: {
    ...typography.bodyMedium,
    color: '#FFF',
    fontWeight: '700',
  },
});
