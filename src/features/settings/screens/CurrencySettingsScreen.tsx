import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { ALL_CURRENCIES } from '../../../shared/constants/currencies';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'CurrencySettings'>;
};

export default function CurrencySettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CURRENCIES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_CURRENCIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.symbol.includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (code: string, symbol: string) => {
    updateSettings({ currencyCode: code, currencySymbol: symbol });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Select Default Currency" onBack={() => navigation.goBack()} />

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by currency name or code (e.g. INR, USD)..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filteredCurrencies.map((curr) => {
          const isSelected = (settings?.currencyCode || 'INR') === curr.code;

          return (
            <TouchableOpacity
              key={curr.code}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => handleSelect(curr.code, curr.symbol)}
              activeOpacity={0.7}
            >
              <View style={[styles.symbolBg, isSelected && styles.symbolBgSelected]}>
                <Text style={[styles.symbolText, isSelected && styles.symbolTextSelected]}>{curr.symbol}</Text>
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    ...typography.body,
    fontSize: 14,
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
  symbolBgSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  symbolText: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  symbolTextSelected: {
    color: colors.primary,
    fontWeight: '700',
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
