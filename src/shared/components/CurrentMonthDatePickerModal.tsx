import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../core/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { getMonthLabel } from '../utils/dateUtils';
import { hapticSelection, hapticLight } from '../utils/haptics';

interface CurrentMonthDatePickerModalProps {
  visible: boolean;
  selectedDateIso: string;
  onSelectDate: (isoDate: string) => void;
  onClose: () => void;
  restrictToCurrentMonth?: boolean;
}

export function CurrentMonthDatePickerModal({
  visible,
  selectedDateIso,
  onSelectDate,
  onClose,
  restrictToCurrentMonth = true,
}: CurrentMonthDatePickerModalProps) {
  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const { theme } = useAppTheme();

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDateNumber = now.getDate(); // 1..31

  // Determine initial view year and month based on props
  const initialDate = useMemo(() => {
    const d = new Date(selectedDateIso);
    return isNaN(d.getTime()) ? now : d;
  }, [selectedDateIso, now]);

  const [viewYear, setViewYear] = useState<number>(
    restrictToCurrentMonth ? currentYear : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    restrictToCurrentMonth ? currentMonth : initialDate.getMonth()
  );

  useEffect(() => {
    if (visible) {
      const d = new Date(selectedDateIso);
      const validDate = isNaN(d.getTime()) ? now : d;
      if (restrictToCurrentMonth) {
        setViewYear(currentYear);
        setViewMonth(currentMonth);
      } else {
        setViewYear(validDate.getFullYear());
        setViewMonth(validDate.getMonth());
      }

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
  }, [visible, selectedDateIso, restrictToCurrentMonth, currentYear, currentMonth, now, fadeAnim, scaleAnim]);

  // Selected date components
  const parsedSelected = useMemo(() => {
    const d = new Date(selectedDateIso);
    return isNaN(d.getTime()) ? now : d;
  }, [selectedDateIso, now]);

  const selYear = parsedSelected.getFullYear();
  const selMonth = parsedSelected.getMonth();
  const selDay = parsedSelected.getDate();

  // Display label for current viewing month
  const viewMonthLabel = useMemo(() => {
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return getMonthLabel(monthKey);
  }, [viewYear, viewMonth]);

  // Days in viewing month
  const totalDaysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  // Day of week for 1st day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  // Navigation handlers (only used when not restricted to current month)
  const handlePrevMonth = () => {
    if (restrictToCurrentMonth) return;
    hapticLight();
    if (viewMonth === 0) {
      setViewYear((prev) => prev - 1);
      setViewMonth(11);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (restrictToCurrentMonth) return;
    hapticLight();
    if (viewMonth === 11) {
      setViewYear((prev) => prev + 1);
      setViewMonth(0);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handlePickDay = (dayNum: number) => {
    // If in current month, cannot pick future days
    if (viewYear === currentYear && viewMonth === currentMonth && dayNum > todayDateNumber) {
      return;
    }
    hapticSelection();
    const pickedDate = new Date(viewYear, viewMonth, dayNum, 12, 0, 0);
    onSelectDate(pickedDate.toISOString());
    onClose();
  };

  const handleQuickShortcut = (daysAgo: number) => {
    const targetDay = todayDateNumber - daysAgo;
    if (targetDay >= 1) {
      hapticSelection();
      const pickedDate = new Date(currentYear, currentMonth, targetDay, 12, 0, 0);
      onSelectDate(pickedDate.toISOString());
      onClose();
    }
  };

  if (!showModal) return null;

  const isViewingCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconBg}>
                  <Ionicons name="calendar" size={18} color={colors.primaryLight} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Select Date</Text>
                  <Text style={styles.headerSubtitle}>
                    {restrictToCurrentMonth
                      ? `Current Month (${viewMonthLabel})`
                      : `${viewMonthLabel} ${viewYear}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Quick Shortcuts for Current Month */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shortcutsRow}
            >
              <TouchableOpacity
                style={[
                  styles.shortcutChip,
                  selYear === currentYear && selMonth === currentMonth && selDay === todayDateNumber && styles.shortcutChipActive,
                ]}
                onPress={() => handleQuickShortcut(0)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.shortcutText,
                    selYear === currentYear && selMonth === currentMonth && selDay === todayDateNumber && styles.shortcutTextActive,
                  ]}
                >
                  Today ({todayDateNumber})
                </Text>
              </TouchableOpacity>

              {todayDateNumber >= 2 && (
                <TouchableOpacity
                  style={[
                    styles.shortcutChip,
                    selYear === currentYear && selMonth === currentMonth && selDay === todayDateNumber - 1 && styles.shortcutChipActive,
                  ]}
                  onPress={() => handleQuickShortcut(1)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.shortcutText,
                      selYear === currentYear && selMonth === currentMonth && selDay === todayDateNumber - 1 && styles.shortcutTextActive,
                    ]}
                  >
                    Yesterday ({todayDateNumber - 1})
                  </Text>
                </TouchableOpacity>
              )}

              {todayDateNumber >= 4 && (
                <TouchableOpacity
                  style={[
                    styles.shortcutChip,
                    selYear === currentYear && selMonth === currentMonth && selDay === todayDateNumber - 3 && styles.shortcutChipActive,
                  ]}
                  onPress={() => handleQuickShortcut(3)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.shortcutText,
                      selYear === currentYear && selMonth === currentMonth && selDay === todayDateNumber - 3 && styles.shortcutTextActive,
                    ]}
                  >
                    3 Days Ago ({todayDateNumber - 3})
                  </Text>
                </TouchableOpacity>
              )}

              {todayDateNumber >= 8 && (
                <TouchableOpacity
                  style={[
                    styles.shortcutChip,
                    selYear === currentYear && selMonth === currentMonth && selDay === todayDateNumber - 7 && styles.shortcutChipActive,
                  ]}
                  onPress={() => handleQuickShortcut(7)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.shortcutText,
                      selYear === currentYear && selMonth === currentMonth && selDay === todayDateNumber - 7 && styles.shortcutTextActive,
                    ]}
                  >
                    7 Days Ago ({todayDateNumber - 7})
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Month & Year Banner */}
            <View style={styles.monthNavRow}>
              {!restrictToCurrentMonth ? (
                <TouchableOpacity
                  style={styles.navArrowBtn}
                  onPress={handlePrevMonth}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.navPlaceholder} />
              )}

              <View style={styles.monthTitleWrap}>
                <Text style={styles.monthYearText}>
                  {viewMonthLabel} {viewYear}
                </Text>
              </View>

              {!restrictToCurrentMonth ? (
                <TouchableOpacity
                  style={styles.navArrowBtn}
                  onPress={handleNextMonth}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.navPlaceholder} />
              )}
            </View>

            {/* Calendar Day Grid Card */}
            <View style={styles.calendarCard}>
              <View style={styles.daysGridHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <Text key={d} style={styles.dayHeaderCell}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {/* Empty cells for offset before 1st day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCellEmpty} />
                ))}

                {/* Actual day cells */}
                {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected =
                    viewYear === selYear && viewMonth === selMonth && dayNum === selDay;
                  const isToday =
                    viewYear === currentYear && viewMonth === currentMonth && dayNum === todayDateNumber;
                  const isDisabled =
                    isViewingCurrentMonth && dayNum > todayDateNumber; // Disabled if future day in current month

                  return (
                    <TouchableOpacity
                      key={dayNum}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                        isDisabled && styles.dayCellDisabled,
                      ]}
                      disabled={isDisabled}
                      onPress={() => handlePickDay(dayNum)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          isToday && !isSelected && styles.dayTextToday,
                          isDisabled && styles.dayTextDisabled,
                        ]}
                      >
                        {dayNum}
                      </Text>
                      {isToday && <View style={styles.todayDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Constraint Info Note */}
            <Text style={styles.infoNote}>
              🔒 Date selection is restricted to the current active month ({viewMonthLabel}). You can record entries for any previous day of this month up to today.
            </Text>

            {/* Close Action Button */}
            <TouchableOpacity style={styles.confirmBtn} onPress={onClose} activeOpacity={0.88}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.confirmBtnText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
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
    paddingHorizontal: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 16,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Shortcuts
  shortcutsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  shortcutChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  shortcutChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: 'rgba(124, 58, 237, 0.5)',
  },
  shortcutText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  shortcutTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },

  // Month & Year Navigation
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPlaceholder: {
    width: 32,
    height: 32,
  },
  monthTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
  },

  // Calendar Grid
  calendarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radius.lg,
    padding: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xs + 2,
  },
  daysGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayHeaderCell: {
    width: '14%',
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderColor: '#C084FC',
  },
  dayCellToday: {
    borderColor: 'rgba(124, 58, 237, 0.5)',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  dayCellDisabled: {
    opacity: 0.2,
    backgroundColor: 'transparent',
  },
  dayText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.textMuted,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 3,
  },

  infoNote: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  confirmBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  confirmGradient: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  confirmBtnText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
