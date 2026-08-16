import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../core/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../shared/utils/currencyUtils';
import {
  filterTransactionsByDateRange,
  generateAndSharePDF,
  generateAndShareCSV,
} from '../../services/exportService';

type PresetKey = 'all_time' | 'this_month' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ExportModal({ visible, onClose }: Props) {
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { showSuccess, showWarning, showError } = useToast();
  const currencySymbol = settings?.currencySymbol ?? '₹';

  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

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
          toValue: 0.94,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Default to 'all_time' so users immediately see and export all their transactions
  const [preset, setPreset] = useState<PresetKey>('all_time');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [loading, setLoading] = useState(false);

  const formatDateString = (d: Date) => d.toISOString().split('T')[0];

  const now = new Date();
  const today = formatDateString(now);

  const [startDate, setStartDate] = useState('1970-01-01');
  const [endDate, setEndDate] = useState(today);

  // Sync custom start/end when preset changes
  const handlePresetSelect = (p: PresetKey) => {
    setPreset(p);
    const currentDate = new Date();
    const todayStr = formatDateString(currentDate);

    if (p === 'all_time') {
      setStartDate('1970-01-01');
      setEndDate(todayStr);
    } else if (p === 'this_month') {
      setStartDate(formatDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)));
      setEndDate(todayStr);
    } else if (p === 'last_30_days') {
      const s = new Date();
      s.setDate(currentDate.getDate() - 30);
      setStartDate(formatDateString(s));
      setEndDate(todayStr);
    } else if (p === 'last_90_days') {
      const s = new Date();
      s.setDate(currentDate.getDate() - 90);
      setStartDate(formatDateString(s));
      setEndDate(todayStr);
    } else if (p === 'this_year') {
      setStartDate(formatDateString(new Date(currentDate.getFullYear(), 0, 1)));
      setEndDate(todayStr);
    }
  };

  // Preview matching transactions count
  const matchingTransactions = useMemo(() => {
    return filterTransactionsByDateRange(transactions, startDate, endDate);
  }, [transactions, startDate, endDate]);

  // Compute preset transaction count badges
  const presetCounts = useMemo(() => {
    const d = new Date();
    const todayStr = formatDateString(d);

    return {
      all_time: filterTransactionsByDateRange(transactions, '1970-01-01', todayStr).length,
      this_month: filterTransactionsByDateRange(
        transactions,
        formatDateString(new Date(d.getFullYear(), d.getMonth(), 1)),
        todayStr
      ).length,
      last_30_days: filterTransactionsByDateRange(
        transactions,
        formatDateString(new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000)),
        todayStr
      ).length,
      last_90_days: filterTransactionsByDateRange(
        transactions,
        formatDateString(new Date(d.getTime() - 90 * 24 * 60 * 60 * 1000)),
        todayStr
      ).length,
      this_year: filterTransactionsByDateRange(
        transactions,
        formatDateString(new Date(d.getFullYear(), 0, 1)),
        todayStr
      ).length,
    };
  }, [transactions]);

  // Financial summary of filtered scope
  const scopeSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of matchingTransactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [matchingTransactions]);

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
        startDate: preset === 'all_time' ? 'All_Time' : startDate,
        endDate,
        format: exportFormat,
        currencySymbol,
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
                <Ionicons name="document-text" size={20} color="#C084FC" />
              </View>
              <View>
                <Text style={styles.title}>Export Financial Report</Text>
                <Text style={styles.subtitle}>Download formatted statement or raw data</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Format Selection */}
            <Text style={styles.sectionLabel}>CHOOSE EXPORT FORMAT</Text>
            <View style={styles.formatRow}>
              <TouchableOpacity
                style={[styles.formatCard, exportFormat === 'pdf' && styles.formatCardActive]}
                onPress={() => setExportFormat('pdf')}
                activeOpacity={0.8}
              >
                <View style={[styles.formatIconCircle, { backgroundColor: exportFormat === 'pdf' ? '#7C3AED' : 'rgba(255,255,255,0.06)' }]}>
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={exportFormat === 'pdf' ? '#FFFFFF' : '#94A3B8'}
                  />
                </View>
                <Text style={[styles.formatText, exportFormat === 'pdf' && styles.formatTextActive]}>
                  PDF Statement
                </Text>
                <Text style={styles.formatSub}>Luxury Styled PDF Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatCard, exportFormat === 'csv' && styles.formatCardActive]}
                onPress={() => setExportFormat('csv')}
                activeOpacity={0.8}
              >
                <View style={[styles.formatIconCircle, { backgroundColor: exportFormat === 'csv' ? '#0284C7' : 'rgba(255,255,255,0.06)' }]}>
                  <Ionicons
                    name="grid-outline"
                    size={20}
                    color={exportFormat === 'csv' ? '#FFFFFF' : '#94A3B8'}
                  />
                </View>
                <Text style={[styles.formatText, exportFormat === 'csv' && styles.formatTextActive]}>
                  CSV Spreadsheet
                </Text>
                <Text style={styles.formatSub}>Excel / Sheets Compatible</Text>
              </TouchableOpacity>
            </View>

            {/* Date Range Presets */}
            <Text style={styles.sectionLabel}>SCOPE & DATE PRESETS</Text>
            <View style={styles.presetGrid}>
              {[
                { key: 'all_time', label: 'All Time', count: presetCounts.all_time },
                { key: 'this_month', label: 'This Month', count: presetCounts.this_month },
                { key: 'last_30_days', label: 'Last 30 Days', count: presetCounts.last_30_days },
                { key: 'last_90_days', label: 'Last 90 Days', count: presetCounts.last_90_days },
                { key: 'this_year', label: 'This Year', count: presetCounts.this_year },
                { key: 'custom', label: 'Custom Range', count: null },
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
                    {p.count !== null ? (
                      <View style={[styles.presetCountBadge, isSelected && styles.presetCountBadgeActive]}>
                        <Text style={[styles.presetCountText, isSelected && styles.presetCountTextActive]}>
                          {p.count}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Date Pickers */}
            {preset === 'custom' && (
              <View style={styles.customDateSection}>
                <Text style={styles.sectionLabel}>CUSTOM DATES (YYYY-MM-DD)</Text>
                <View style={styles.datesRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.inputLabel}>From Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={startDate === '1970-01-01' ? '' : startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={styles.dateCol}>
                    <Text style={styles.inputLabel}>To Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Live Financial Scope Summary Card */}
            <View style={styles.scopeCard}>
              <View style={styles.scopeHeaderRow}>
                <View style={styles.scopeTag}>
                  <Ionicons name="receipt-outline" size={14} color="#C084FC" />
                  <Text style={styles.scopeTagText}>
                    <Text style={{ fontWeight: '900', color: '#FFFFFF' }}>{matchingTransactions.length}</Text> Records Selected
                  </Text>
                </View>
                <Text style={styles.scopeNetText}>
                  Net: {formatCurrency(scopeSummary.net, 'INR', currencySymbol)}
                </Text>
              </View>

              <View style={styles.scopePillsRow}>
                <View style={styles.scopePill}>
                  <Text style={styles.scopePillLabel}>Inflow</Text>
                  <Text style={styles.scopePillValIncome}>+{formatCurrency(scopeSummary.income, 'INR', currencySymbol)}</Text>
                </View>
                <View style={styles.scopeDivider} />
                <View style={styles.scopePill}>
                  <Text style={styles.scopePillLabel}>Outflow</Text>
                  <Text style={styles.scopePillValExpense}>-{formatCurrency(scopeSummary.expense, 'INR', currencySymbol)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportSubmitBtn}
              onPress={handleExport}
              disabled={loading || matchingTransactions.length === 0}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#7C3AED', '#6D28D9', '#5B21B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.exportSubmitGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color="#FFF" />
                    <Text style={styles.exportSubmitText}>
                      Export {matchingTransactions.length} Items ({exportFormat.toUpperCase()})
                    </Text>
                  </>
                )}
              </LinearGradient>
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
    backgroundColor: 'rgba(6, 6, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    backgroundColor: '#131024',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    maxHeight: 400,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },

  // Format Cards
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  formatCard: {
    flex: 1,
    backgroundColor: '#100C1F',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formatCardActive: {
    borderColor: '#C084FC',
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
  },
  formatIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  formatText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  formatTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formatSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Presets
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#100C1F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipActive: {
    borderColor: '#C084FC',
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  presetCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetCountBadgeActive: {
    backgroundColor: '#C084FC',
  },
  presetCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  presetCountTextActive: {
    color: '#07060E',
  },

  // Custom Dates
  customDateSection: {
    marginBottom: 14,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#100C1F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },

  // Scope Summary Card
  scopeCard: {
    backgroundColor: '#100C1F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  scopeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scopeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scopeTagText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  scopeNetText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  scopePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scopePill: {
    flex: 1,
    alignItems: 'center',
  },
  scopePillLabel: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  scopePillValIncome: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 1,
  },
  scopePillValExpense: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F43F5E',
    marginTop: 1,
  },
  scopeDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  exportSubmitBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  exportSubmitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
  },
  exportSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
