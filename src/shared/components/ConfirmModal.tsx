import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../core/theme';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
  calloutText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  loading = false,
  icon,
  badge,
  calloutText,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const { theme } = useAppTheme();
  const c = theme.colors;

  const defaultIcon: keyof typeof Ionicons.glyphMap = icon
    ? icon
    : isDestructive
    ? 'trash-outline'
    : 'log-out-outline';

  useEffect(() => {
    if (visible) {
      setShowModal(true);
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

  if (!showModal) return null;

  const themeColors = isDestructive
    ? {
        gradientStart: '#2A0E17',
        gradientEnd: '#13060B',
        borderColor: 'rgba(244, 63, 94, 0.35)',
        shadowColor: '#F43F5E',
        iconBg: 'rgba(244, 63, 94, 0.16)',
        iconBorder: 'rgba(244, 63, 94, 0.38)',
        iconColor: '#F43F5E',
        badgeBg: 'rgba(244, 63, 94, 0.15)',
        badgeText: '#FDA4AF',
        calloutBg: 'rgba(244, 63, 94, 0.08)',
        calloutBorder: 'rgba(244, 63, 94, 0.22)',
        btnGrad: ['#F43F5E', '#E11D48'] as [string, string],
      }
    : {
        gradientStart: c.surface,
        gradientEnd: c.background,
        borderColor: c.cardBorderActive,
        shadowColor: c.primary,
        iconBg: c.primaryMuted,
        iconBorder: `${c.primaryLight}59`,
        iconColor: c.primaryLight,
        badgeBg: c.primaryMuted,
        badgeText: c.textSecondary,
        calloutBg: c.primaryMuted,
        calloutBorder: `${c.primary}33`,
        btnGrad: theme.accentGradient,
      };

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={[styles.cardGradient, { borderColor: themeColors.borderColor }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Top Specular Line */}
            <View style={styles.specularLine} />

            {/* Badge Indicator if provided */}
            {badge ? (
              <View style={[styles.badgePill, { backgroundColor: themeColors.badgeBg }]}>
                <Text style={[styles.badgeText, { color: themeColors.badgeText }]}>{badge}</Text>
              </View>
            ) : null}

            {/* Glowing Icon Ring */}
            <View
              style={[
                styles.iconRing,
                {
                  backgroundColor: themeColors.iconBg,
                  borderColor: themeColors.iconBorder,
                },
              ]}
            >
              <Ionicons
                name={defaultIcon}
                size={28}
                color={themeColors.iconColor}
              />
            </View>

            {/* Text Content */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Optional Callout / Warning Box */}
            {calloutText ? (
              <View
                style={[
                  styles.calloutBox,
                  {
                    backgroundColor: themeColors.calloutBg,
                    borderColor: themeColors.calloutBorder,
                  },
                ]}
              >
                <Ionicons
                  name={isDestructive ? 'warning-outline' : 'shield-checkmark-outline'}
                  size={16}
                  color={themeColors.iconColor}
                />
                <Text style={styles.calloutText}>{calloutText}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={onConfirm}
                disabled={loading}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={themeColors.btnGrad}
                  style={styles.confirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmText}>{confirmLabel}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 4, 11, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 24,
  },
  cardGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 24,
    position: 'relative',
  },
  specularLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },

  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.xs + 2,
    letterSpacing: -0.3,
  },
  message: {
    ...typography.body,
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.md,
  },

  calloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.lg,
    width: '100%',
  },
  calloutText: {
    ...typography.caption,
    color: '#E2E8F0',
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },

  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    width: '100%',
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.bodyMedium,
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  confirmGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  confirmText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
