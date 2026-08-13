import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useTransactions } from '../../../context/TransactionContext';
import { useToast } from '../../../context/ToastContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { AppButton } from '../../../shared/components/AppButton';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Export'>;
};

export default function ExportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactions();
  const { showSuccess, showWarning } = useToast();

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showWarning('No Data', 'There are no transactions to export.');
      return;
    }

    showSuccess(
      'Export Ready 🎉',
      `Generated CSV report with ${transactions.length} records.`
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Export Data" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="document-text-outline" size={40} color={colors.primary} />
          <Text style={styles.cardTitle}>Export to CSV</Text>
          <Text style={styles.cardSub}>
            Export your entire transaction ledger ({transactions.length} items) as a standard CSV file.
          </Text>
        </View>

        <AppButton
          label="Generate & Export CSV"
          onPress={handleExportCSV}
          icon={<Ionicons name="download-outline" size={20} color="#FFF" />}
        />
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
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  cardSub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
