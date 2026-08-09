import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useSettings } from '../../../context/SettingsContext';
import { colors, typography, spacing, radius } from '../../../core/theme';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const SLIDES = [
  {
    id: '1',
    icon: 'receipt-outline' as const,
    iconColor: '#7C3AED',
    gradient: ['rgba(124,58,237,0.15)', 'rgba(124,58,237,0.03)'] as [string, string],
    title: 'Track Every\nRupee',
    subtitle:
      'Log your income and expenses in seconds. Know exactly where your money goes every month.',
  },
  {
    id: '2',
    icon: 'pie-chart-outline' as const,
    iconColor: '#10B981',
    gradient: ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.03)'] as [string, string],
    title: 'Insightful\nReports',
    subtitle:
      'Beautiful charts break down your spending by category, day, and month. Spot trends instantly.',
  },
  {
    id: '3',
    icon: 'wallet-outline' as const,
    iconColor: '#F59E0B',
    gradient: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.03)'] as [string, string],
    title: 'Budget\nSmarter',
    subtitle:
      'Set budgets per category and get notified before you overspend. Build wealth one day at a time.',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { updateSettings } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleGetStarted = async () => {
    await updateSettings({ onboardingCompleted: true });
    navigation.replace('MainTabs');
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <LinearGradient colors={item.gradient} style={styles.iconBg}>
              <Ionicons name={item.icon} size={80} color={item.iconColor} />
            </LinearGradient>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
            />
          );
        })}
      </View>

      {/* Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {isLastSlide ? (
          <TouchableOpacity style={styles.getStartedBtn} onPress={handleGetStarted} activeOpacity={0.85}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.getStartedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={goToNext} activeOpacity={0.85}>
              <LinearGradient
                colors={['#7C3AED', '#5B21B6']}
                style={styles.nextGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  iconBg: {
    width: 160,
    height: 160,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  nextBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  nextText: {
    ...typography.bodyMedium,
    color: '#FFF',
  },
  getStartedBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
  },
  getStartedText: {
    ...typography.subheading,
    color: '#FFF',
  },
});
