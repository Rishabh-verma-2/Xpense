import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../core/theme';
import { getMonthLabel, shiftMonth } from '../utils/dateUtils';

interface MonthSelectorProps {
  monthKey: string; // YYYY-MM
  onChange: (newMonthKey: string) => void;
}

export function MonthSelector({ monthKey, onChange }: MonthSelectorProps) {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = monthKey === currentMonthKey;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onChange(shiftMonth(monthKey, -1))}
        style={styles.arrowBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.labelWrapper}>
        <Text style={styles.label}>{getMonthLabel(monthKey)}</Text>
        {isCurrentMonth && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Current</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => onChange(shiftMonth(monthKey, 1))}
        style={styles.arrowBtn}
        disabled={isCurrentMonth}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isCurrentMonth ? colors.textMuted : colors.textSecondary}
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
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 9,
  },
});
