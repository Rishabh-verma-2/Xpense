import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { ChangePasswordModal } from '../../../shared/components/ChangePasswordModal';
import { colors, typography, spacing, radius } from '../../../core/theme';
import { getSafeTopInset } from '../../../shared/utils/layoutUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExportModal } from '../../../shared/components/ExportModal';
import { useTransactions } from '../../../context/TransactionContext';
import { useAppTheme } from '../../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;
};

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = getSafeTopInset(insets);
  const { settings, updateSettings } = useSettings();
  const { user, logout, updateAvatar } = useAuth();
  const { deleteAllTransactions } = useTransactions();
  const { theme } = useAppTheme();
  const { showSuccess, showInfo, showError } = useToast();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Helper to calculate approximate size in KB from base64
  const getApproxSizeKB = (base64OrUri: string | null): number => {
    if (!base64OrUri) return 0;
    if (base64OrUri.startsWith('data:')) {
      const stringLength = base64OrUri.length - base64OrUri.indexOf(',') - 1;
      return Math.round((stringLength * 3) / 4 / 1024);
    }
    return 280;
  };

  // 1. Launch Camera with 1:1 Crop & Compression < 1MB
  const handleLaunchCamera = async () => {
    setShowAvatarOptions(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission Required', 'Please allow camera access to take a profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Compresses image to under 1MB
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPendingAvatar(base64Data);
      }
    } catch (err: any) {
      showError('Camera Error', err?.message || 'Could not open camera.');
    }
  };

  // 2. Launch Photo Library with 1:1 Crop & Compression < 1MB
  const handleLaunchLibrary = async () => {
    setShowAvatarOptions(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos Permission Required', 'Please allow photo gallery access to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Compresses image to under 1MB
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPendingAvatar(base64Data);
      }
    } catch (err: any) {
      showError('Gallery Error', err?.message || 'Could not access photo library.');
    }
  };

  // 3. Confirm and Upload avatar to Cloudinary
  const handleConfirmAvatarUpload = async () => {
    if (!pendingAvatar) return;
    setUploadingAvatar(true);
    try {
      await updateAvatar(pendingAvatar);
      showSuccess('Profile Photo Updated! 📸', 'Your avatar was saved to Cloudinary.');
      setPendingAvatar(null);
    } catch (err: any) {
      showError('Upload Failed', err?.message || 'Could not save profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 4. Remove custom avatar
  const handleRemoveAvatar = async () => {
    setShowAvatarOptions(false);
    setUploadingAvatar(true);
    try {
      await updateAvatar('');
      showInfo('Photo Removed', 'Reverted back to your glowing initial avatar.');
    } catch {
      showError('Error', 'Could not remove avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      showInfo('Logged Out 👋', 'You have been signed out successfully.');

      const rootNav = navigation.getParent()?.getParent();
      if (rootNav) {
        rootNav.reset({
          index: 0,
          routes: [{ name: 'Login' as any }],
        });
      } else {
        (navigation as any).navigate('Login');
      }
    } catch {
      showError('Error', 'Failed to log out.');
    } finally {
      setLoggingOut(false);
    }
  };

  const confirmResetData = async () => {
    try {
      setErasing(true);
      await deleteAllTransactions();
      await AsyncStorage.clear();
      showInfo('Data Reset', 'All transactions and user data have been reset.');
      setShowResetModal(false);

      const rootNav = navigation.getParent()?.getParent();
      if (rootNav) {
        rootNav.reset({
          index: 0,
          routes: [{ name: 'Splash' as any }],
        });
      } else {
        (navigation as any).navigate('Splash');
      }
    } catch (err: any) {
      showError('Error', err.message || 'Failed to erase all data.');
    } finally {
      setErasing(false);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          'Take control of your personal finances with Xpense! Track spending, set category budgets, and analyze trends securely with zero latency: https://xpense.app',
        title: 'Track your spending with Xpense',
      });
    } catch {
      // Ignore dismissed share sheets
    }
  };

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  const renderSettingRow = (
    icon: string,
    title: string,
    subtitle?: string,
    value?: string,
    onPress?: () => void,
    danger = false,
    badge?: string,
    iconColor?: string
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.rowIconBg,
          { backgroundColor: danger ? theme.colors.expenseMuted : theme.colors.primaryMuted },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? theme.colors.expense : iconColor || theme.colors.primaryLight}
        />
      </View>

      <View style={styles.rowTextCol}>
        <Text style={[styles.rowTitle, { color: danger ? theme.colors.expense : theme.colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
      </View>

      {badge ? (
        <View style={[styles.badgeContainer, { backgroundColor: theme.colors.primaryMuted }]}>
          <Text style={[styles.badgeText, { color: theme.accentColor }]}>{badge}</Text>
        </View>
      ) : null}

      {value ? <Text style={[styles.rowValue, { color: theme.accentColor }]}>{value}</Text> : null}

      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} style={{ marginLeft: 4 }} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Account Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── User Profile Hero Card ── */}
        <View style={[styles.profileCard, { borderColor: theme.colors.cardBorderActive }]}>
          <LinearGradient
            colors={theme.heroGradient}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.specularLine} />

            <View style={styles.profileMainRow}>
              {/* Avatar with Camera Overlay */}
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={() => setShowAvatarOptions(true)}
                disabled={uploadingAvatar}
                activeOpacity={0.85}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={theme.accentGradient}
                    style={styles.avatarCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.avatarText}>{userInitial}</Text>
                  </LinearGradient>
                )}

                {/* Edit Camera Badge */}
                <View style={[styles.cameraBadge, { backgroundColor: theme.accentColor }]}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              {/* User Details */}
              <View style={styles.profileInfoCol}>
                <View style={styles.profileNameRow}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {user?.name || 'Xpense User'}
                  </Text>
                  <View style={[styles.proPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" />
                    <Text style={styles.proPillText}>PRO</Text>
                  </View>
                </View>

                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.email || 'user@xpense.app'}
                </Text>

                <TouchableOpacity
                  style={styles.editPhotoPrompt}
                  onPress={() => setShowAvatarOptions(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="image-outline" size={12} color={theme.accentColor} />
                  <Text style={[styles.editPhotoText, { color: theme.accentColor }]}>Change Profile Picture</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Section 1: Financial & Appearance Preferences ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textMuted }]}>PREFERENCES & APPEARANCE</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
            {renderSettingRow(
              'color-palette-outline',
              'Appearance & Themes',
              'Select custom luxury palette and card gradients',
              theme.name,
              () => navigation.navigate('ThemeSettings'),
              false,
              undefined,
              theme.accentColor
            )}
            <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder }]} />
            {renderSettingRow(
              'cash-outline',
              'Default Currency',
              'Used for transactions and budget totals',
              `${settings?.currencyCode || 'INR'} (${settings?.currencySymbol || '₹'})`,
              () => navigation.navigate('CurrencySettings'),
              false,
              undefined,
              '#38BDF8'
            )}
            <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder }]} />
            {renderSettingRow(
              'notifications-outline',
              'Notifications & Alerts',
              'Budget overspend warnings & daily reminders',
              undefined,
              () => navigation.navigate('NotificationSettings'),
              false,
              undefined,
              '#FBBF24'
            )}
          </View>
        </View>

        {/* ── Section 2: Data & Storage ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textMuted }]}>DATA & BACKUP</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
            {renderSettingRow(
              'pricetags-outline',
              'Category Management',
              'Customize expense & income categories',
              undefined,
              () => navigation.navigate('CategoryManagement'),
              false,
              undefined,
              '#34D399'
            )}
            <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder }]} />
            {renderSettingRow(
              'cloud-download-outline',
              'Export Financial Statements',
              'Download CSV spreadsheets or detailed PDF reports',
              undefined,
              () => setShowExportModal(true),
              false,
              undefined,
              '#818CF8'
            )}
          </View>
        </View>

        {/* ── Section 3: Security & Support ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textMuted }]}>SECURITY & SUPPORT</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
            {renderSettingRow(
              'lock-closed-outline',
              'Change Password',
              'Update your secure account password',
              undefined,
              () => setShowPasswordModal(true),
              false,
              undefined,
              '#A78BFA'
            )}
            <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder }]} />
            {renderSettingRow(
              'share-social-outline',
              'Share Xpense App',
              'Invite friends & family to track finances together',
              undefined,
              handleShareApp,
              false,
              undefined,
              '#38BDF8'
            )}
            <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder }]} />
            {renderSettingRow(
              'help-circle-outline',
              'Help & FAQ',
              'Answers to common questions and tutorials',
              undefined,
              () => navigation.navigate('HelpFaq'),
              false,
              undefined,
              '#F59E0B'
            )}
            <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder }]} />
            {renderSettingRow(
              'chatbubble-ellipses-outline',
              'Feedback & Feature Requests',
              'Help us shape the future of Xpense',
              undefined,
              () => navigation.navigate('Feedback'),
              false,
              undefined,
              '#34D399'
            )}
            <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder }]} />
            {renderSettingRow(
              'information-circle-outline',
              'About Xpense',
              'Version 1.0.0 • Architecture & Credits',
              undefined,
              () => navigation.navigate('About'),
              false,
              undefined,
              '#F472B6'
            )}
          </View>
        </View>

        {/* ── Section 4: Account Actions ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.colors.textMuted }]}>ACCOUNT ACTIONS</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
            {renderSettingRow(
              'log-out-outline',
              'Log Out',
              'Safely sign out from this device',
              undefined,
              () => setShowLogoutModal(true),
              false,
              undefined,
              theme.colors.textSecondary
            )}
          </View>
        </View>

        {/* ── Section 5: Danger Zone ── */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.colors.expense }]}>DANGER ZONE</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.expense}40` }]}>
            {renderSettingRow(
              'trash-outline',
              'Erase All App Data',
              'Permanently deletes all transactions and cached state',
              undefined,
              () => setShowResetModal(true),
              true
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Photo Source Action Sheet ── */}
      <Modal
        visible={showAvatarOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheetCard}>
            <View style={styles.actionSheetHeader}>
              <Ionicons name="camera-outline" size={20} color="#C084FC" />
              <Text style={styles.actionSheetTitle}>Profile Picture</Text>
            </View>

            <View style={styles.actionOptionsList}>
              <TouchableOpacity
                style={styles.actionOptionRow}
                onPress={handleLaunchCamera}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIconBg, { backgroundColor: 'rgba(192, 132, 252, 0.15)' }]}>
                  <Ionicons name="camera" size={18} color="#C084FC" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionOptionText}>Take Photo</Text>
                  <Text style={styles.actionOptionSub}>Use camera with 1:1 square crop</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionOptionRow}
                onPress={handleLaunchLibrary}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="images" size={18} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionOptionText}>Choose from Gallery</Text>
                  <Text style={styles.actionOptionSub}>Select and crop from your photos</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>

              {user?.avatar ? (
                <TouchableOpacity
                  style={styles.actionOptionRow}
                  onPress={handleRemoveAvatar}
                  activeOpacity={0.75}
                >
                  <View style={[styles.actionIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                    <Ionicons name="trash-outline" size={18} color="#F43F5E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionOptionText, { color: '#F43F5E' }]}>Remove Photo</Text>
                    <Text style={styles.actionOptionSub}>Reset to glowing initial avatar</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.actionCancelBtn}
              onPress={() => setShowAvatarOptions(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Avatar Crop & Preview Review Modal ── */}
      <Modal
        visible={!!pendingAvatar}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingAvatar(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewCropCard}>
            <View style={styles.actionSheetHeader}>
              <Ionicons name="crop" size={20} color="#C084FC" />
              <Text style={styles.actionSheetTitle}>Avatar Preview & Crop</Text>
            </View>

            {pendingAvatar && (
              <View style={styles.previewContainer}>
                <View style={styles.previewImageRing}>
                  <Image source={{ uri: pendingAvatar }} style={styles.croppedImagePreview} />
                </View>
                <View style={styles.sizeBadgePill}>
                  <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                  <Text style={styles.sizeBadgeText}>
                    ~{getApproxSizeKB(pendingAvatar)} KB • Compressed & Under 1 MB
                  </Text>
                </View>
                <Text style={styles.previewHint}>1:1 Square Crop • Optimized for Cloudinary Storage</Text>
              </View>
            )}

            <View style={styles.previewActionRow}>
              <TouchableOpacity
                style={styles.previewCancelBtn}
                onPress={() => setPendingAvatar(null)}
                disabled={uploadingAvatar}
                activeOpacity={0.8}
              >
                <Text style={styles.previewCancelText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.previewUploadBtn}
                onPress={handleConfirmAvatarUpload}
                disabled={uploadingAvatar}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  style={styles.previewUploadGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.previewUploadText}>Save to Profile</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Logout Confirmation */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Log Out of Xpense?"
        message="Are you sure you want to sign out? Your cloud data remains securely backed up on MongoDB Atlas."
        confirmLabel="Log Out"
        cancelLabel="Stay Logged In"
        isDestructive={false}
        icon="log-out-outline"
        badge="Cloud Backup Safe"
        calloutText="You can sign back in anytime with your email or Google account on any device."
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Reset Data Confirmation */}
      <ConfirmModal
        visible={showResetModal}
        title="Erase All App Data?"
        message="This will permanently delete all local transactions, custom categories, budgets, and cached records from this device."
        confirmLabel="Erase Everything"
        cancelLabel="Keep My Data"
        isDestructive={true}
        icon="trash-bin-outline"
        badge="Irreversible Action"
        calloutText="⚠️ Caution: This cannot be undone. Make sure you have exported your statements before resetting."
        loading={erasing}
        onConfirm={confirmResetData}
        onCancel={() => setShowResetModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Full clearance for floating bottom bar
    gap: 16,
  },

  // Profile Card
  profileCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  profileGradient: {
    padding: 18,
    position: 'relative',
  },
  specularLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  profileMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#C084FC',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#150A2E',
  },
  profileInfoCol: {
    flex: 1,
    gap: 3,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  proPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D8B4FE',
    letterSpacing: 0.5,
  },
  profileEmail: {
    fontSize: 12,
    color: '#94A3B8',
  },
  editPhotoPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  editPhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C084FC',
  },

  // Sections
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#120F20',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowIconBg: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dangerTitle: {
    color: '#F43F5E',
  },
  rowSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginLeft: 60,
  },

  // Action Sheet & Preview Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionSheetCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#131024',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    gap: 14,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  actionOptionsList: {
    gap: 8,
  },
  actionOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#100C1F',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  actionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOptionText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  actionCancelBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  actionCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Crop Preview Card
  previewCropCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#131024',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    gap: 16,
    alignItems: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  previewImageRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#C084FC',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  croppedImagePreview: {
    width: '100%',
    height: '100%',
  },
  sizeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  sizeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
  },
  previewHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  previewActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  previewCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  previewUploadBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewUploadGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  previewUploadText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
