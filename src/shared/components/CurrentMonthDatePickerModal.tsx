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
import { getMonthLabel } from '../utils/dateUtils';

interface CurrentMonthDatePickerModalProps {
  visible: boolean;
  selectedDateIso: string;
  onSelectDate: (isoDate: string) => void;
  onClose: () => void;
}

export function CurrentMonthDatePickerModal({
  visible,
  selectedDateIso,
  onSelectDate,
  onClose,
}: CurrentMonthDatePickerModalProps) {
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

  // Current Month Constraints
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDateNumber = now.getDate(); // 1..31

  const currentMonthLabel = useMemo(() => {
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return getMonthLabel(monthKey);
  }, [currentYear, currentMonth]);

  // Days in current month
  const totalDaysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Currently selected day number
  const selectedDayNum = useMemo(() => {
    const d = new Date(selectedDateIso);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      return d.getDate();
    }
    return todayDateNumber;
  }, [selectedDateIso, currentYear, currentMonth, todayDateNumber]);

  const handlePickDay = (dayNum: number) => {
    if (dayNum > todayDateNumber) return; // Constraint: Cannot pick future days

    // Construct Date object for selected day in current month
    const pickedDate = new Date(currentYear, currentMonth, dayNum, 12, 0, 0);
    onSelectDate(pickedDate.toISOString());
    onClose();
  };

  const handleQuickShortcut = (daysAgo: number) => {
    const targetDay = todayDateNumber - daysAgo;
    if (targetDay >= 1) {
      handlePickDay(targetDay);
    }
  };

  if (!showModal) return null;

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
                  <Text style={styles.headerSubtitle}>Current Month ({currentMonthLabel})</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Quick Shortcuts */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shortcutsRow}
            >
              <TouchableOpacity
                style={[
                  styles.shortcutChip,
                  selectedDayNum === todayDateNumber && styles.shortcutChipActive,
                ]}
                onPress={() => handleQuickShortcut(0)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.shortcutText,
                    selectedDayNum === todayDateNumber && styles.shortcutTextActive,
                  ]}
                >
                  Today ({todayDateNumber})
                </Text>
              </TouchableOpacity>

              {todayDateNumber >= 2 && (
                <TouchableOpacity
                  style={[
                    styles.shortcutChip,
                    selectedDayNum === todayDateNumber - 1 && styles.shortcutChipActive,
                  ]}
                  onPress={() => handleQuickShortcut(1)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.shortcutText,
                      selectedDayNum === todayDateNumber - 1 && styles.shortcutTextActive,
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
                    selectedDayNum === todayDateNumber - 3 && styles.shortcutChipActive,
                  ]}
                  onPress={() => handleQuickShortcut(3)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.shortcutText,
                      selectedDayNum === todayDateNumber - 3 && styles.shortcutTextActive,
                    ]}
                  >
                    3 Days Ago ({todayDateNumber - 3})
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

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
                {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = dayNum === selectedDayNum;
                  const isToday = dayNum === todayDateNumber;
                  const isDisabled = dayNum > todayDateNumber; // Disabled if in future of current month

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

            {/* Info Note */}
            <Text style={styles.infoNote}>
              🔒 Date selection is restricted to the current active month ({currentMonthLabel}).
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
    maxHeight: '85%',
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

  // Calendar Grid
  calendarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radius.lg,
    padding: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
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
    gap: 3,
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '13.5%',
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
    opacity: 0.25,
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
    bottom: 4,
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
