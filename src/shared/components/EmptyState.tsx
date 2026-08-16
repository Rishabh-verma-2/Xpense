import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius } from '../../core/theme';
import { useAppTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useAppTheme();
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <Ionicons name={icon as any} size={40} color={c.textMuted} />
      </View>
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: c.primaryMuted, borderColor: `${c.primary}40` }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionText, { color: c.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subheading,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  actionText: {
    ...typography.bodyMedium,
  },
});
