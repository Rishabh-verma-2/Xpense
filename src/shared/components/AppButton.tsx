import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../../core/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  icon,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, fullWidth && styles.fullWidth, isDisabled && styles.disabled]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isDisabled ? ['#4B5563', '#374151'] : ['#7C3AED', '#5B21B6']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              {icon}
              <Text style={styles.primaryLabel}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, styles.secondary, fullWidth && styles.fullWidth, isDisabled && styles.disabled]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <>
            {icon}
            <Text style={styles.secondaryLabel}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, styles.danger, fullWidth && styles.fullWidth, isDisabled && styles.disabled]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={colors.expense} size="small" />
        ) : (
          <>
            {icon}
            <Text style={styles.dangerLabel}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  // Ghost
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, fullWidth && styles.fullWidth, isDisabled && styles.disabled]}
      activeOpacity={0.6}
    >
      {loading ? (
        <ActivityIndicator color={colors.textSecondary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={styles.ghostLabel}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    borderRadius: radius.full,
  },
  primaryLabel: {
    ...typography.bodyMedium,
    color: '#FFF',
    fontSize: 16,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  secondaryLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 16,
  },
  danger: {
    backgroundColor: colors.expenseMuted,
    borderWidth: 1,
    borderColor: `${colors.expense}40`,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  dangerLabel: {
    ...typography.bodyMedium,
    color: colors.expense,
    fontSize: 16,
  },
  ghostLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 16,
  },
});
