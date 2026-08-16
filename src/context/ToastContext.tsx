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
  Platform,
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

  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -50,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity, scale]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setToast(options);
      translateY.setValue(-60);
      opacity.setValue(0);
      scale.setValue(0.85);
      progressAnim.setValue(1);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 8,
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
    [translateY, opacity, scale, progressAnim, hideToast]
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
          icon: 'checkmark' as const,
          iconColor: '#10B981',
          avatarBg: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 0.45)',
          glowColor: '#10B981',
        };
      case 'error':
        return {
          icon: 'close' as const,
          iconColor: '#F43F5E',
          avatarBg: 'rgba(244, 63, 94, 0.2)',
          borderColor: 'rgba(244, 63, 94, 0.45)',
          glowColor: '#F43F5E',
        };
      case 'warning':
        return {
          icon: 'alert' as const,
          iconColor: '#F59E0B',
          avatarBg: 'rgba(245, 158, 11, 0.2)',
          borderColor: 'rgba(245, 158, 11, 0.45)',
          glowColor: '#F59E0B',
        };
      case 'info':
      default:
        return {
          icon: 'sparkles' as const,
          iconColor: '#C084FC',
          avatarBg: 'rgba(168, 85, 247, 0.2)',
          borderColor: 'rgba(192, 132, 252, 0.45)',
          glowColor: '#C084FC',
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
              top: Math.max(insets?.top || 44, 40) + 4,
              opacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
          pointerEvents="box-none"
        >
          {(() => {
            const details = getTypeDetails(toast.type);
            const progressWidth = progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            });

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={hideToast}
                style={[
                  styles.dynamicIslandPill,
                  {
                    borderColor: details.borderColor,
                    shadowColor: details.glowColor,
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(24, 18, 40, 0.96)', 'rgba(11, 8, 20, 0.98)']}
                  style={styles.pillGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  {/* Top Specular Rim */}
                  <View style={styles.specularRim} />

                  <View style={styles.contentRow}>
                    {/* Neon Micro Avatar */}
                    <View
                      style={[
                        styles.neonAvatar,
                        { backgroundColor: details.avatarBg, borderColor: `${details.iconColor}50` },
                      ]}
                    >
                      <Ionicons name={details.icon} size={15} color={details.iconColor} />
                    </View>

                    {/* Text Details */}
                    <View style={styles.textCol}>
                      <Text style={styles.titleText} numberOfLines={1}>
                        {toast.title}
                      </Text>
                      {toast.message ? (
                        <Text style={styles.messageText} numberOfLines={1}>
                          {toast.message}
                        </Text>
                      ) : null}
                    </View>

                    {/* Close dismiss dot */}
                    <View style={styles.dismissDot}>
                      <Ionicons name="close" size={12} color="#94A3B8" />
                    </View>
                  </View>

                  {/* Micro Progress Bar */}
                  <View style={styles.progressTrack}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: progressWidth,
                          backgroundColor: details.iconColor,
                        },
                      ]}
                    />
                  </View>
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
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dynamicIslandPill: {
    alignSelf: 'center',
    maxWidth: 370,
    minWidth: 260,
    borderRadius: 26,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 18,
    backgroundColor: '#0B0814',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }
      : {}),
  },
  pillGradient: {
    paddingTop: 8,
    paddingBottom: 0,
    paddingHorizontal: 12,
    position: 'relative',
  },
  specularRim: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  neonAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  messageText: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 1,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  dismissDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  progressFill: {
    height: '100%',
  },
});
