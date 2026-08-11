import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '../../../core/navigation/SettingsStackNavigator';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { colors, typography, spacing, radius } from '../../../core/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExportModal } from '../../../shared/components/ExportModal';

import { useTransactions } from '../../../context/TransactionContext';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;
};

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { user, logout } = useAuth();
  const { deleteAllTransactions } = useTransactions();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Login' as any }],
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Erase All Data',
      'This will permanently delete all your transactions, categories, budgets, and settings both locally and from your account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1) Wipe all transactions (local + MongoDB Atlas backend)
              await deleteAllTransactions();
              // 2) Clear AsyncStorage
              await AsyncStorage.clear();
              // 3) Reset onboarding
              await updateSettings({ onboardingCompleted: false });
              // 4) Success popup confirmation
              Alert.alert(
                'Data Erased Successfully',
                'All your transaction history, budgets, and data have been completely deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.getParent()?.reset({
                        index: 0,
                        routes: [{ name: 'Splash' as any }],
                      });
                    },
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to erase all data.');
            }
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
        {/* User Account Card */}
        {user ? (
          <View style={styles.userCard}>
            <View style={styles.avatarBg}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || 'Xpense User'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        ) : null}

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
            'document-text-outline',
            'Export Report (PDF / CSV)',
            undefined,
            () => setShowExportModal(true)
          )}
        </View>

        {/* Account & Safety Section */}
        <Text style={styles.sectionHeader}>Account & Security</Text>
        <View style={styles.card}>
          {renderSettingRow(
            'log-out-outline',
            'Log Out',
            undefined,
            handleLogoutPress,
            true
          )}
        </View>

        {/* App Info */}
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
            'Reset Local App Data',
            undefined,
            handleResetData,
            true
          )}
        </View>
      </ScrollView>

      {/* Export Data Modal */}
      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconBadge}>
              <Ionicons name="log-out-outline" size={30} color="#EF4444" />
            </View>

            <Text style={styles.modalTitle}>Log Out of Xpense?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={confirmLogout}
                disabled={loggingOut}
                activeOpacity={0.88}
              >
                {loggingOut ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.logoutBtnText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: spacing.xxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  avatarBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card || '#1E1E2D',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder || 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.subheading,
    fontSize: 19,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  logoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

