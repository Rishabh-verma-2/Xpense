import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../core/theme';
import { useAppTheme } from '../../context/ThemeContext';

export function MobileInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    // Check if already running in standalone mode (already installed on home screen)
    const isInStandaloneMode =
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      ((window.navigator as any)?.standalone === true);

    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) return; // Don't prompt if already running as an installed PWA!

    // Register Service Worker for PWA compliance
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration error:', err));
    }

    // Capture PWA install prompt event on Chrome/Android/Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Auto-show prompt after 2 seconds for mobile web users
    const isMobileWeb = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
    if (isMobileWeb && !isInStandaloneMode) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleInstallPress = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show iOS step-by-step instructions
      setShowIosModal(true);
    }
  };

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: 120,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible || isStandalone) return null;

  return (
    <>
      {/* Mobile Install Bottom Sheet Bar */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        <View style={styles.sheetContent}>
          <View style={styles.iconBg}>
            <Ionicons name="phone-portrait" size={20} color="#C084FC" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.sheetTitle}>Add Xpense to Home Screen 📲</Text>
            <Text style={styles.sheetSubtitle}>Install for full-screen mobile app experience</Text>
          </View>
          <TouchableOpacity style={styles.installBtn} onPress={handleInstallPress} activeOpacity={0.88}>
            <LinearGradient
              colors={['#A855F7', '#7C3AED']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Install</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Guided iOS Install Modal */}
      <Modal
        visible={showIosModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIosModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="sparkles" size={22} color="#C084FC" />
              <Text style={styles.modalTitle}>Install Xpense App</Text>
            </View>

            <Text style={styles.modalSubtitle}>To add Xpense to your mobile home screen:</Text>

            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.stepText}>Tap the <Text style={styles.bold}>Share</Text> button in your mobile browser toolbar.</Text>
            </View>

            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepText}>Scroll down and select <Text style={styles.bold}>"Add to Home Screen"</Text> 📲.</Text>
            </View>

            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepText}>Tap <Text style={styles.bold}>"Add"</Text> in top right corner. Launch from your home screen!</Text>
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowIosModal(false)}>
              <Text style={styles.closeModalText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  sheetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161325',
    borderRadius: radius.xl,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    gap: spacing.sm,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  installBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  btnText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  closeBtn: {
    padding: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 17,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    color: colors.primaryLight,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '800',
    fontSize: 11,
  },
  stepText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 12,
  },
  bold: {
    fontWeight: '700',
    color: colors.primaryLight,
  },
  closeModalBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  closeModalText: {
    ...typography.bodyMedium,
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
