import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { typography, spacing, radius } from '../../../core/theme';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, loading: settingsLoading } = useSettings();
  const { token, loading: authLoading } = useAuth();
  const loading = settingsLoading || authLoading;

  // --- Animation State Drivers ---
  // 1) Logo Pop-Up & Rotation
  const logoScale = useRef(new Animated.Value(0.1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(-16)).current;

  // 2) Specular Sheen Shimmer
  const shimmerTranslateX = useRef(new Animated.Value(-120)).current;

  // 3) Title Reveal (Slide & Fade)
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(24)).current;
  const titleLetterSpacing = useRef(new Animated.Value(4)).current;

  // 4) Tagline Pill Reveal
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(14)).current;
  const taglineScale = useRef(new Animated.Value(0.92)).current;

  // 5) Sleek Loading Indicator Dots
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const dot1Scale = useRef(new Animated.Value(0.6)).current;
  const dot2Scale = useRef(new Animated.Value(0.6)).current;
  const dot3Scale = useRef(new Animated.Value(0.6)).current;

  // 6) Ambient Aurora Glow Pulses
  const glowScale1 = useRef(new Animated.Value(0.85)).current;
  const glowScale2 = useRef(new Animated.Value(1.15)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // 7) Exit Transition
  const exitScale = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // ── 0. Ambient Glow Fade-in & Continuous Breathing ──
    Animated.timing(glowOpacity, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();

    // Primary Glow Loop (Violet)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale1, {
          toValue: 1.28,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale1, {
          toValue: 0.85,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Secondary Glow Loop (Cyan / Electric Purple)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale2, {
          toValue: 0.88,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale2, {
          toValue: 1.25,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── 1. Phase 1: Brand Emblem Pop-Up ──
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 95,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(logoRotate, {
          toValue: 0,
          tension: 90,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── 2. Phase 2: Specular Sheen Sweep ──
    Animated.sequence([
      Animated.delay(480),
      Animated.timing(shimmerTranslateX, {
        toValue: 140,
        duration: 750,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // ── 3. Phase 3: Title Reveal ──
    Animated.sequence([
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── 4. Phase 4: Tagline Pill Reveal ──
    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(taglineScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── 5. Phase 5: Loader Indicator Fade-In & Dot Loop ──
    Animated.sequence([
      Animated.delay(1300),
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered Dot Pulsing
    const createDotLoop = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1.4,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.6,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createDotLoop(dot1Scale, 0).start();
    createDotLoop(dot2Scale, 150).start();
    createDotLoop(dot3Scale, 300).start();
  }, []);

  // ── Exit Navigation Transition ──
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitScale, {
          toValue: 1.2,
          duration: 350,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 1. Authenticated users go straight to Dashboard
        if (token) {
          navigation.replace('MainTabs');
          return;
        }

        // 2. First-time mobile users go to Onboarding
        if (!settings?.onboardingCompleted) {
          navigation.replace('Onboarding');
          return;
        }

        // 3. Desktop web visitors go to Landing page, mobile/PWA users go to Login
        const isDesktopWeb =
          Platform.OS === 'web' &&
          typeof navigator !== 'undefined' &&
          !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '') &&
          !(typeof window !== 'undefined' && ((window as any).matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any)?.standalone === true));

        if (isDesktopWeb) {
          navigation.replace('Landing');
        } else {
          navigation.replace('Login');
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, settings, token]);

  const rotate = logoRotate.interpolate({
    inputRange: [-16, 0],
    outputRange: ['-16deg', '0deg'],
  });

  return (
    <LinearGradient
      colors={['#05040B', '#0D091D', '#05040B']}
      locations={[0, 0.52, 1]}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Dynamic Ambient Aurora Halos ── */}
      <Animated.View
        style={[
          styles.glowAurora1,
          { opacity: glowOpacity, transform: [{ scale: glowScale1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.glowAurora2,
          { opacity: glowOpacity, transform: [{ scale: glowScale2 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.glowCore,
          { opacity: glowOpacity, transform: [{ scale: glowScale1 }] },
        ]}
      />

      {/* ── Main Animated Wrapper ── */}
      <Animated.View
        style={[
          styles.contentWrapper,
          { opacity: exitOpacity, transform: [{ scale: exitScale }] },
        ]}
      >
        {/* 1. Glassmorphic Emblem Card housing Brand Icon */}
        <Animated.View
          style={[
            styles.emblemCard,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate }],
            },
          ]}
        >
          <LinearGradient
            colors={['#2A1650', '#160B30', '#0E061E']}
            style={styles.emblemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Top Specular Reflection Highlight */}
            <View style={styles.specularTopLine} />

            {/* High-Resolution Brand Icon */}
            <Image
              source={require('../../../../assets/icon.png')}
              style={styles.brandIconImage}
              resizeMode="contain"
            />

            {/* Specular Light-Sweep Shimmer */}
            <Animated.View
              style={[
                styles.shimmerSweep,
                { transform: [{ translateX: shimmerTranslateX }, { rotate: '25deg' }] },
              ]}
            />
          </LinearGradient>
        </Animated.View>

        {/* 2. Typography: "Xpense." */}
        <Animated.View
          style={[
            styles.titleWrapper,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>
            Xpense<Text style={styles.appNameDot}>.</Text>
          </Text>
        </Animated.View>

        {/* 3. Luxury Tagline Badge */}
        <Animated.View
          style={[
            styles.taglineWrapper,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }, { scale: taglineScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.16)', 'rgba(124, 58, 237, 0.08)']}
            style={styles.taglinePill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.taglineDot} />
            <Text style={styles.taglineText}>TRACK · BUDGET · GROW</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      {/* ── Bottom Section: Discrete Loader & Footer ── */}
      <Animated.View
        style={[
          styles.footerWrapper,
          { opacity: Animated.multiply(footerOpacityAnim(loaderOpacity), exitOpacity) },
        ]}
      >
        {/* Sleek 3-Dot Status Indicator */}
        <View style={styles.loaderDotsRow}>
          <Animated.View style={[styles.loaderDot, { transform: [{ scale: dot1Scale }] }]} />
          <Animated.View style={[styles.loaderDot, { transform: [{ scale: dot2Scale }] }]} />
          <Animated.View style={[styles.loaderDot, { transform: [{ scale: dot3Scale }] }]} />
        </View>

        <Text style={styles.footerBrandText}>Personal Finance & Wealth Intelligence</Text>
        <Text style={styles.footerSubText}>Encrypted • Local-First • Offline-Ready</Text>
      </Animated.View>
    </LinearGradient>
  );
}

// Helper to bridge opacity
function footerOpacityAnim(loaderAnim: Animated.Value) {
  return loaderAnim;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05040B',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Ambient Aurora Glows ──
  glowAurora1: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
  },
  glowAurora2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  glowCore: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
  },

  // ── Glassmorphic Emblem Card ──
  emblemCard: {
    width: 124,
    height: 124,
    borderRadius: 36,
    marginBottom: spacing.lg + 2,
    backgroundColor: 'transparent',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.38)',
    overflow: 'hidden',
  },
  emblemGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  specularTopLine: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 1,
  },
  brandIconImage: {
    width: 104,
    height: 104,
    borderRadius: 28,
  },
  shimmerSweep: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },

  // ── Typography ──
  titleWrapper: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  appName: {
    fontSize: 46,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -1.2,
  },
  appNameDot: {
    color: '#A855F7',
  },

  // ── Tagline Badge ──
  taglineWrapper: {
    alignItems: 'center',
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md + 6,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.28)',
  },
  taglineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#A855F7',
  },
  taglineText: {
    ...typography.caption,
    color: 'rgba(233, 213, 255, 0.95)',
    letterSpacing: 2.5,
    fontSize: 11,
    fontWeight: '800' as const,
  },

  // ── Footer & Loader ──
  footerWrapper: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
    gap: 6,
  },
  loaderDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  loaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A855F7',
  },
  footerBrandText: {
    ...typography.caption,
    color: 'rgba(226, 232, 240, 0.75)',
    letterSpacing: 0.6,
    fontSize: 12,
    fontWeight: '600',
  },
  footerSubText: {
    ...typography.caption,
    color: 'rgba(148, 163, 184, 0.45)',
    letterSpacing: 0.4,
    fontSize: 10,
  },
});
