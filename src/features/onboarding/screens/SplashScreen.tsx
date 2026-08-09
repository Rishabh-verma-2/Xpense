import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing } from '../../../core/theme';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  const { settings, loading } = useSettings();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      // Fade out before navigating
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (!settings?.onboardingCompleted) {
          navigation.replace('Onboarding');
        } else {
          navigation.replace('MainTabs');
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, settings]);

  return (
    <LinearGradient
      colors={['#0A0A0F', '#12111E', '#0A0A0F']}
      style={styles.container}
    >
      {/* Background glow */}
      <View style={styles.glowCircle} />

      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          style={styles.logoIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="wallet" size={40} color="#FFFFFF" />
        </LinearGradient>

        <Animated.View style={{ opacity: textFadeAnim }}>
          <Text style={styles.appName}>Xpense</Text>
          <Text style={styles.tagline}>Track · Budget · Grow</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: textFadeAnim }]}>
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
    backgroundColor: colors.background,
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    top: height * 0.25,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  logoIcon: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    ...typography.displayLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 40,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontSize: 12,
    marginTop: -spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xxl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
