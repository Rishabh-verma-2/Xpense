import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius } from '../../core/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { getMonthLabel, shiftMonth } from '../utils/dateUtils';

interface MonthSelectorProps {
  monthKey: string; // YYYY-MM
  onChange: (newMonthKey: string) => void;
}

export function MonthSelector({ monthKey, onChange }: MonthSelectorProps) {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = monthKey === currentMonthKey;
  const { theme } = useAppTheme();
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onChange(shiftMonth(monthKey, -1))}
        style={[styles.arrowBtn, { backgroundColor: c.card, borderColor: c.cardBorder }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={20} color={c.textSecondary} />
      </TouchableOpacity>

      <View style={styles.labelWrapper}>
        <Text style={[styles.label, { color: c.textPrimary }]}>{getMonthLabel(monthKey)}</Text>
        {isCurrentMonth && (
          <View style={[styles.badge, { backgroundColor: c.primaryMuted }]}>
            <Text style={[styles.badgeText, { color: c.primary }]}>Current</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => onChange(shiftMonth(monthKey, 1))}
        style={[styles.arrowBtn, { backgroundColor: c.card, borderColor: c.cardBorder }]}
        disabled={isCurrentMonth}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isCurrentMonth ? c.textMuted : c.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 160,
    justifyContent: 'center',
  },
  label: {
    ...typography.subheading,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.label,
    fontSize: 9,
  },
});
