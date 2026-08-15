import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { colors, radius, spacing, typography } from '../../core/theme';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({ visible, onClose, initialEmail = '' }: ForgotPasswordModalProps) {
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Step 1 = Request OTP by Email, Step 2 = Enter OTP & New Password
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      setStep(1);
      setEmail(initialEmail);
      setOtp('');
      setDevOtp(null);
      setNewPassword('');
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
          tension: 70,
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
  }, [visible, initialEmail, fadeAnim, scaleAnim]);

  // Step 1: Send OTP to email via Nodemailer
  const handleSendOtp = async () => {
    const rawEmail = email.trim();
    if (!rawEmail) {
      setErrors({ email: 'Please enter your email address.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await authApi.forgotPassword({ email: rawEmail });
      if ((res as any).devOtp || (res as any).otp) {
        setDevOtp((res as any).devOtp || (res as any).otp);
      }
      showSuccess('OTP Sent! ✉️', res.message || 'Check your email for the 6-digit verification code.');
      setStep(2);
    } catch (err: any) {
      showError('Failed to Send Code', err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async () => {
    const rawOtp = otp.trim();
    if (!rawOtp) {
      setErrors({ otp: 'Please enter the 6-digit code.' });
      return;
    }
    if (rawOtp.length < 4) {
      setErrors({ otp: 'Please enter a valid verification code.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrors({ newPassword: 'New password must be at least 6 characters.' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await authApi.resetPasswordOtp({
        email: email.trim(),
        otp: rawOtp,
        newPassword,
      });
      showSuccess('Password Reset! 🎉', res.message || 'You can now log in with your new password.');
      onClose();
    } catch (err: any) {
      showError('Reset Failed', err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <Modal visible={showModal} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconBg}>
                  <Ionicons name="mail-open" size={18} color={colors.primaryLight} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>
                    {step === 1 ? 'Forgot Password?' : 'Enter Verification Code'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {step === 1 ? 'Receive an email OTP reset code' : `Code sent to ${email}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={loading}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {step === 1 ? (
              /* Step 1: Email Form */
              <View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Registered Email Address</Text>
                  <View style={[styles.inputRow, errors.email && styles.fieldError]}>
                    <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="user@example.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="paper-plane-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.submitText}>Send Verification Code</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* Step 2: OTP & New Password Form */
              <View>
                {devOtp ? (
                  <TouchableOpacity
                    style={styles.devOtpBanner}
                    onPress={() => setOtp(devOtp)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.devOtpRow}>
                      <Ionicons name="sparkles" size={14} color="#F59E0B" />
                      <Text style={styles.devOtpText}>
                        Code: <Text style={styles.devOtpCode}>{devOtp}</Text>
                      </Text>
                    </View>
                    <Text style={styles.devOtpPaste}>Tap to Auto-fill</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>6-Digit Verification Code (OTP)</Text>
                  <View style={[styles.inputRow, errors.otp && styles.fieldError]}>
                    <Ionicons name="keypad-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="123456"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                  {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <View style={[styles.inputRow, errors.newPassword && styles.fieldError]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Min 6 characters"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} disabled={loading}>
                    <Text style={styles.backText}>Change Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitBtnFlex}
                    onPress={handleResetPassword}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.submitGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.submitText}>Reset Password</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconBg: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 16,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  devOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginBottom: spacing.md,
  },
  devOtpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  devOtpText: {
    ...typography.caption,
    color: '#FDE68A',
    fontSize: 12,
  },
  devOtpCode: {
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  devOtpPaste: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 11,
  },

  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  fieldError: {
    borderColor: colors.expense,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 13,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.expense,
    fontSize: 11,
    marginTop: 4,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  backBtn: {
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  submitBtnFlex: {
    flex: 1,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  submitBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  submitGradient: {
    flexDirection: 'row',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  submitText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
