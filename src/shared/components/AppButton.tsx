import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing, radius } from '../../core/theme';
import { useAppTheme } from '../../context/ThemeContext';

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
  const { theme } = useAppTheme();
  const c = theme.colors;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, fullWidth && styles.fullWidth, isDisabled && styles.disabled]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isDisabled ? ['#4B5563', '#374151'] : theme.accentGradient}
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
        style={[
          styles.base,
          { backgroundColor: c.card, borderColor: c.cardBorder },
          styles.secondaryBase,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
        ]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={c.primary} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.secondaryLabel, { color: c.textPrimary }]}>{label}</Text>
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
        style={[
          styles.base,
          { backgroundColor: c.expenseMuted, borderColor: `${c.expense}40` },
          styles.dangerBase,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
        ]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={c.expense} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.dangerLabel, { color: c.expense }]}>{label}</Text>
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
        <ActivityIndicator color={c.textSecondary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.ghostLabel, { color: c.textSecondary }]}>{label}</Text>
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
  secondaryBase: {
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  secondaryLabel: {
    ...typography.bodyMedium,
    fontSize: 16,
  },
  dangerBase: {
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  dangerLabel: {
    ...typography.bodyMedium,
    fontSize: 16,
  },
  ghostLabel: {
    ...typography.bodyMedium,
    fontSize: 16,
  },
});
