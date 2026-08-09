import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'NotificationSettings'>;
};

export default function NotificationSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.title}>Budget Alert Notifications</Text>
              <Text style={styles.sub}>
                Receive alerts when spending exceeds 70%, 90%, or 100% of a budget.
              </Text>
            </View>
            <Switch
              value={settings?.budgetNotificationsEnabled ?? true}
              onValueChange={(val) => updateSettings({ budgetNotificationsEnabled: val })}
              trackColor={{ false: colors.surface, true: colors.primaryMuted }}
              thumbColor={settings?.budgetNotificationsEnabled ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.title}>Daily Reminder</Text>
              <Text style={styles.sub}>
                Get a reminder every evening to log your expenses.
              </Text>
            </View>
            <Switch
              value={settings?.dailyReminderEnabled ?? false}
              onValueChange={(val) => updateSettings({ dailyReminderEnabled: val })}
              trackColor={{ false: colors.surface, true: colors.primaryMuted }}
              thumbColor={settings?.dailyReminderEnabled ? colors.primary : colors.textMuted}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  sub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
});
