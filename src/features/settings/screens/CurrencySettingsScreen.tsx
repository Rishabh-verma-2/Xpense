import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'CurrencySettings'>;
};

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export default function CurrencySettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  const handleSelect = (code: string, symbol: string) => {
    updateSettings({ currencyCode: code, currencySymbol: symbol });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Select Currency" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {CURRENCIES.map((curr) => {
          const isSelected = settings?.currencyCode === curr.code;

          return (
            <TouchableOpacity
              key={curr.code}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => handleSelect(curr.code, curr.symbol)}
              activeOpacity={0.7}
            >
              <View style={styles.symbolBg}>
                <Text style={styles.symbolText}>{curr.symbol}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{curr.name}</Text>
                <Text style={styles.code}>{curr.code}</Text>
              </View>
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          );
        })}
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
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  symbolBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    ...typography.subheading,
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  code: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
