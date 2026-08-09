import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;
};

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently erase all transactions, categories, and budgets. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            await updateSettings({ onboardingCompleted: false });
            Alert.alert('Reset Complete', 'App data has been cleared.');
          },
        },
      ]
    );
  };

  const renderSettingRow = (
    icon: string,
    title: string,
    value?: string,
    onPress?: () => void,
    danger = false
  ) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBg, danger && styles.dangerIconBg]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? colors.expense : colors.primary}
        />
      </View>
      <Text style={[styles.rowTitle, danger && styles.dangerTitle]}>{title}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Preference Section */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.card}>
          {renderSettingRow(
            'pricetag-outline',
            'Category Management',
            undefined,
            () => navigation.navigate('CategoryManagement')
          )}
          <View style={styles.divider} />
          {renderSettingRow(
            'cash-outline',
            'Currency',
            `${settings?.currencyCode} (${settings?.currencySymbol})`,
            () => navigation.navigate('CurrencySettings')
          )}
          <View style={styles.divider} />
          {renderSettingRow(
            'notifications-outline',
            'Notifications',
            undefined,
            () => navigation.navigate('NotificationSettings')
          )}
        </View>

        {/* Data & Backup Section */}
        <Text style={styles.sectionHeader}>Data & Backup</Text>
        <View style={styles.card}>
          {renderSettingRow(
            'download-outline',
            'Export Data (CSV)',
            undefined,
            () => navigation.navigate('Export')
          )}
        </View>

        {/* System & About */}
        <Text style={styles.sectionHeader}>App Info</Text>
        <View style={styles.card}>
          {renderSettingRow(
            'information-circle-outline',
            'About Xpense',
            'v1.0.0',
            () => navigation.navigate('About')
          )}
          <View style={styles.divider} />
          {renderSettingRow(
            'trash-outline',
            'Reset All App Data',
            undefined,
            handleResetData,
            true
          )}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIconBg: {
    backgroundColor: colors.expenseMuted,
  },
  rowTitle: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  dangerTitle: {
    color: colors.expense,
  },
  rowValue: {
    ...typography.caption,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: 52,
  },
});
