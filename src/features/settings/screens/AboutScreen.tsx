import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'About'>;
};

export default function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="About" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.logoBg}>
          <Ionicons name="wallet" size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Xpense</Text>
        <Text style={styles.version}>Version 1.0.0 (Build 100)</Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Xpense is a privacy-focused personal expense tracker built with React Native and Expo.
            All your financial data stays 100% offline and secure on your device.
          </Text>
        </View>

        <Text style={styles.footerText}>Made with ❤️ for smart budgeting</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: spacing.md,
  },
  cardText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 'auto',
  },
});
