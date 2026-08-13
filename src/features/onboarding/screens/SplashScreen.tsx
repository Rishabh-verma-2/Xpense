import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { typography, spacing, radius } from '../../../core/theme';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  const { settings, loading: settingsLoading } = useSettings();
  const { token, loading: authLoading } = useAuth();
  const loading = settingsLoading || authLoading;

  // --- Sequential Animation Values ---
  // 1) Logo Pop-Up
  const logoScale = useRef(new Animated.Value(0.1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(-20)).current;

  // 2) Title Slide & Fade (Triggers after Logo pops up)
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(28)).current;

  // 3) Tagline Slide & Fade (Triggers after Title)
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(18)).current;

  // 4) Footer Fade
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // Exit Animation
  const exitScale = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  // Ambient Glow Pulse
  const glowScale = useRef(new Animated.Value(0.85)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 0) Ambient Background Glow Fades In
    Animated.timing(glowOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.25,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.85,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // PHASE 1: ONLY the Logo Pops Up in the center
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 90,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
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

    // PHASE 2: AFTER logo settles, the Title ("Xpense") slides up below the logo
    Animated.sequence([
      Animated.delay(750),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 450,
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

    // PHASE 3: Tagline ("TRACK · BUDGET · GROW") slides up below title
    Animated.sequence([
      Animated.delay(1150),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // PHASE 4: Footer Fades In
    Animated.sequence([
      Animated.delay(1450),
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Exit transition after loading is complete
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitScale, {
          toValue: 1.25,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!settings?.onboardingCompleted) {
          navigation.replace('Onboarding');
        } else if (token) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [loading, settings, token]);

  const rotate = logoRotate.interpolate({
    inputRange: [-20, 0],
    outputRange: ['-20deg', '0deg'],
  });

  return (
    <LinearGradient
      colors={['#06060D', '#0D0B1A', '#06060D']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {/* Animated exit wrapper */}
      <Animated.View
        style={[
          styles.exitWrapper,
          { opacity: exitOpacity, transform: [{ scale: exitScale }] },
        ]}
      >
        {/* Ambient background glow */}
        <Animated.View
          style={[
            styles.glowOuter,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.glowInner,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />

        {/* PHASE 1: Transparent Glassmorphic Logo Badge Pops Up */}
        <Animated.View
          style={[
            styles.logoImageWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.25)', 'rgba(124, 58, 237, 0.08)']}
            style={styles.logoBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoInnerIconRing}>
              <Ionicons name="wallet-outline" size={54} color="#C084FC" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* PHASE 2: App Title ("Xpense.") Slides Up */}
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

        {/* PHASE 3: Tagline Pill Slides Up */}
        <Animated.View
          style={[
            styles.taglineWrapper,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          <View style={styles.taglinePill}>
            <Text style={styles.taglineText}>TRACK · BUDGET · GROW</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* PHASE 4: Bottom Footer */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Text style={styles.footerText}>Your personal finance companion</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06060D',
  },
  exitWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  glowInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  logoImageWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'transparent',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  logoBadgeGradient: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    padding: 4,
  },
  logoInnerIconRing: {
    width: 104,
    height: 104,
    borderRadius: 30,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  appNameDot: {
    color: '#A855F7',
  },
  taglineWrapper: {
    alignItems: 'center',
  },
  taglinePill: {
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  taglineText: {
    ...typography.caption,
    color: 'rgba(216, 180, 254, 0.95)',
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xxl,
  },
  footerText: {
    ...typography.caption,
    color: 'rgba(156, 163, 175, 0.6)',
    letterSpacing: 0.5,
  },
});
