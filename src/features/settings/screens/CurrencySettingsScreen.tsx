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
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { ALL_CURRENCIES } from '../../../shared/constants/currencies';
import { useAppTheme } from '../../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'CurrencySettings'>;
};

export default function CurrencySettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CURRENCIES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_CURRENCIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.symbol.includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (code: string, symbol: string) => {
    updateSettings({ currencyCode: code, currencySymbol: symbol });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Default Currency" onBack={() => navigation.goBack()} />

      <View style={[styles.searchWrapper, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
        <Ionicons name="search-outline" size={18} color={tc.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: tc.textPrimary }]}
          placeholder="Search by country, name, or symbol..."
          placeholderTextColor={tc.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={tc.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>SELECT ACTIVE APP CURRENCY</Text>

        <View style={styles.currencyCardList}>
          {filteredCurrencies.map((curr) => {
            const isSelected = curr.code === (settings?.currencyCode ?? 'INR');

            return (
              <TouchableOpacity
                key={curr.code}
                style={[
                  styles.row,
                  { backgroundColor: tc.card, borderColor: isSelected ? theme.accentColor : tc.cardBorder },
                  isSelected && { backgroundColor: `${theme.accentColor}12` },
                ]}
                onPress={() => handleSelect(curr.code, curr.symbol)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.symbolBg,
                    { backgroundColor: tc.surface, borderColor: tc.cardBorder },
                    isSelected && { backgroundColor: tc.primaryMuted, borderColor: theme.accentColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.symbolText,
                      { color: isSelected ? theme.accentColor : tc.textPrimary },
                    ]}
                  >
                    {curr.symbol}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: isSelected ? theme.accentColor : tc.textPrimary }]}>{curr.name}</Text>
                  <Text style={[styles.code, { color: tc.textMuted }]}>{curr.code}</Text>
                </View>
                {isSelected ? (
                  <View style={styles.checkWrap}>
                    <Ionicons name="checkmark-circle" size={22} color={theme.accentColor} />
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={tc.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120F20',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 4,
  },
  currencyCardList: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120F20',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  rowSelected: {
    borderColor: '#C084FC',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  symbolBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  symbolBgSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: '#C084FC',
  },
  symbolText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#CBD5E1',
  },
  symbolTextSelected: {
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nameSelected: {
    fontWeight: '800',
  },
  code: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  checkWrap: {
    paddingRight: 4,
  },
});
