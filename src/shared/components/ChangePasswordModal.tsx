import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../core/theme';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useAuth();
  const { showSuccess, showError } = useToast();
  const { theme } = useAppTheme();
  const c = theme.colors;

  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [activeField, setActiveField] = useState<'current' | 'new' | 'confirm' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength calculation
  const strengthInfo = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#EF4444', width: '25%' };
      case 2:
        return { score: 2, label: 'Fair', color: '#F59E0B', width: '50%' };
      case 3:
        return { score: 3, label: 'Good', color: '#38BDF8', width: '75%' };
      case 4:
      default:
        return { score: 4, label: 'Strong', color: '#10B981', width: '100%' };
    }
  }, [newPassword]);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 75,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Please enter your current password.';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters.';
    }
    if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      showSuccess('Password Updated! 🔒', 'Your account password has been changed successfully.');
      onClose();
    } catch (err: any) {
      showError('Update Failed', err.message || 'Could not update password. Please verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <Modal visible={showModal} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoidingContainer}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
            {/* Top Specular Line */}
            <View style={styles.specularLine} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={[styles.headerIconBg, { backgroundColor: `${c.primary}26`, borderColor: `${c.primaryLight}59` }]}>
                    <Ionicons name="shield-checkmark" size={20} color={c.primaryLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Change Password</Text>
                    <Text style={styles.headerSubtitle}>Update your login credentials securely</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* 1. Current Password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>
                <View
                  style={[
                    styles.inputRow,
                    activeField === 'current' && { borderColor: c.primaryLight, backgroundColor: `${c.primary}14` },
                    errors.currentPassword ? styles.fieldError : undefined,
                  ]}
                >
                  <Ionicons
                    name="key-outline"
                    size={18}
                    color={activeField === 'current' ? c.primaryLight : c.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter current password"
                    placeholderTextColor="rgba(148, 163, 184, 0.45)"
                    secureTextEntry={!showCurrent}
                    value={currentPassword}
                    onChangeText={(val) => {
                      setCurrentPassword(val);
                      if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: '' }));
                    }}
                    onFocus={() => setActiveField('current')}
                    onBlur={() => setActiveField(null)}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrent(!showCurrent)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={c.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {errors.currentPassword ? (
                  <Text style={styles.errorText}>{errors.currentPassword}</Text>
                ) : null}
              </View>

              {/* 2. New Password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
                <View
                  style={[
                    styles.inputRow,
                    activeField === 'new' && { borderColor: c.primaryLight, backgroundColor: `${c.primary}14` },
                    errors.newPassword ? styles.fieldError : undefined,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={activeField === 'new' ? c.primaryLight : c.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Min 6 characters"
                    placeholderTextColor="rgba(148, 163, 184, 0.45)"
                    secureTextEntry={!showNew}
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                    onFocus={() => setActiveField('new')}
                    onBlur={() => setActiveField(null)}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNew(!showNew)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showNew ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={c.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Strength Meter */}
                {newPassword.length > 0 ? (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthTrack}>
                      <View
                        style={[
                          styles.strengthFill,
                          { width: strengthInfo.width as any, backgroundColor: strengthInfo.color },
                        ]}
                      />
                    </View>
                    <View style={styles.strengthTextRow}>
                      <Text style={styles.strengthHint}>Security Level</Text>
                      <Text style={[styles.strengthBadge, { color: strengthInfo.color }]}>
                        {strengthInfo.label}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {errors.newPassword ? (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                ) : null}
              </View>

              {/* 3. Confirm Password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
                <View
                  style={[
                    styles.inputRow,
                    activeField === 'confirm' && { borderColor: c.primaryLight, backgroundColor: `${c.primary}14` },
                    errors.confirmPassword ? styles.fieldError : undefined,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={activeField === 'confirm' ? c.primaryLight : c.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter new password"
                    placeholderTextColor="rgba(148, 163, 184, 0.45)"
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    onFocus={() => setActiveField('confirm')}
                    onBlur={() => setActiveField(null)}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm(!showConfirm)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={c.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              {/* Security Hint */}
              <View style={[styles.securityHintBox, { backgroundColor: `${c.primary}14`, borderColor: `${c.primary}2E` }]}>
                <Ionicons name="information-circle-outline" size={15} color={c.primaryLight} />
                <Text style={styles.securityHintText}>
                  Passwords must be 6+ characters. Never share your credentials.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={[c.primaryLight, c.primary]}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="lock-closed" size={15} color="#FFF" />
                        <Text style={styles.submitText}>Save Password</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avoidingContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 4, 11, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: '#120F20',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1.2,
    borderColor: 'rgba(192, 132, 252, 0.28)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  specularLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  scrollContent: {
    paddingVertical: spacing.xs,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
  },
  headerIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Form Fields
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: '#94A3B8',
    marginBottom: spacing.xs,
    fontWeight: '700',
    fontSize: 10.5,
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputRowActive: {
    borderColor: '#C084FC',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  fieldError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontSize: 14,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  },

  // Strength Meter
  strengthContainer: {
    marginTop: 6,
    gap: 4,
  },
  strengthTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthHint: {
    fontSize: 10,
    color: '#64748B',
  },
  strengthBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Security Callout
  securityHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.18)',
    marginBottom: spacing.lg,
    marginTop: 2,
  },
  securityHintText: {
    ...typography.caption,
    color: '#CBD5E1',
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.bodyMedium,
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    flex: 1.3,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  submitGradient: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.full,
  },
  submitText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
