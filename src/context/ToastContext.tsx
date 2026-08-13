import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../core/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const { width } = Dimensions.get('window');

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setToast(options);
      translateY.setValue(-120);
      opacity.setValue(0);
      progressAnim.setValue(1);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = options.duration ?? 3200;
      Animated.timing(progressAnim, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, progressAnim, hideToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => showToast({ type: 'success', title, message }),
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => showToast({ type: 'error', title, message }),
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => showToast({ type: 'info', title, message }),
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    [showToast]
  );

  const getTypeDetails = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: '#10B981',
          gradient: ['rgba(16, 185, 129, 0.22)', 'rgba(5, 150, 105, 0.08)'],
          borderColor: 'rgba(16, 185, 129, 0.4)',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          iconColor: '#EF4444',
          gradient: ['rgba(239, 68, 68, 0.22)', 'rgba(220, 38, 38, 0.08)'],
          borderColor: 'rgba(239, 68, 68, 0.4)',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          iconColor: '#F59E0B',
          gradient: ['rgba(245, 158, 11, 0.22)', 'rgba(217, 119, 6, 0.08)'],
          borderColor: 'rgba(245, 158, 11, 0.4)',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: '#A855F7',
          gradient: ['rgba(168, 85, 247, 0.22)', 'rgba(124, 58, 237, 0.08)'],
          borderColor: 'rgba(168, 85, 247, 0.4)',
        };
    }
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        hideToast,
      }}
    >
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastWrapper,
            {
              top: (insets?.top || 40) + spacing.sm,
              opacity,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          {(() => {
            const details = getTypeDetails(toast.type);
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={hideToast}
                style={[styles.toastContainer, { borderColor: details.borderColor }]}
              >
                <LinearGradient
                  colors={details.gradient as [string, string, ...string[]]}
                  style={styles.toastGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.iconBg, { backgroundColor: `${details.iconColor}20` }]}>
                    <Ionicons name={details.icon} size={22} color={details.iconColor} />
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={styles.titleText} numberOfLines={1}>
                      {toast.title}
                    </Text>
                    {toast.message ? (
                      <Text style={styles.messageText} numberOfLines={2}>
                        {toast.message}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons name="close" size={18} color="rgba(156, 163, 175, 0.7)" />
                </LinearGradient>
              </TouchableOpacity>
            );
          })()}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F0E17',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 16,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    gap: spacing.md,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  messageText: {
    ...typography.caption,
    color: 'rgba(209, 213, 219, 0.85)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});

