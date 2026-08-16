import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { useAppTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { ThemeId } from '../../../core/theme/themes';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'ThemeSettings'>;
};

export default function ThemeSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme, themeId, setThemeId, availableThemes } = useAppTheme();
  const tc = theme.colors;
  const { showSuccess } = useToast();

  const handleSelectTheme = async (id: ThemeId, name: string) => {
    if (id === themeId) return;
    await setThemeId(id);
    showSuccess('Theme Applied! ✨', `${name} is now active across all screens.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Appearance & Themes" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionHeaderTitle, { color: tc.textMuted }]}>CURATED LUXURY THEMES</Text>
        <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
          Select a custom palette to transform gradients, card glows, and dashboard aesthetics.
        </Text>

        <View style={styles.themeList}>
          {availableThemes.map((item) => {
            const isSelected = item.id === themeId;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: tc.card,
                    borderColor: isSelected ? item.accentColor : tc.cardBorder,
                  },
                ]}
                onPress={() => handleSelectTheme(item.id, item.name)}
                activeOpacity={0.85}
              >
                {/* Mini Mock Dashboard Hero Card */}
                <View style={styles.mockHeroCard}>
                  <LinearGradient
                    colors={item.heroGradient}
                    style={styles.mockHeroGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.mockSpecularLine} />
                    <View style={styles.mockHeroTop}>
                      <View style={styles.mockPillRow}>
                        <View
                          style={[
                            styles.mockDot,
                            { backgroundColor: item.colors.income },
                          ]}
                        />
                        <Text style={[styles.mockHeroLabel, { color: item.colors.textSecondary }]}>
                          NET WORTH
                        </Text>
                      </View>
                      <View style={[styles.mockModeBadge, { borderColor: item.accentColor }]}>
                        <Text style={[styles.mockModeText, { color: item.accentColor }]}>
                          {item.mode.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.mockBalance, { color: item.colors.textPrimary }]}>
                      ₹2,48,500
                    </Text>

                    {/* Color Swatch Dots */}
                    <View style={styles.swatchRow}>
                      {item.previewColors.map((col, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.swatchDot,
                            { backgroundColor: col, borderColor: 'rgba(255, 255, 255, 0.2)' },
                          ]}
                        />
                      ))}
                    </View>
                  </LinearGradient>
                </View>

                {/* Theme Details Row */}
                <View style={styles.themeInfoRow}>
                  <View style={styles.themeTextCol}>
                    <View style={styles.themeTitleRow}>
                      <Text style={[styles.themeTitle, { color: tc.textPrimary }]}>{item.name}</Text>
                      {isSelected && (
                        <View style={[styles.activeTag, { backgroundColor: item.accentColor }]}>
                          <Text style={styles.activeTagText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.themeTagline, { color: tc.textSecondary }]}>{item.tagline}</Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected
                        ? {
                            borderColor: item.accentColor,
                            backgroundColor: item.accentColor,
                          }
                        : {
                            borderColor: tc.cardBorder,
                          },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#07060E', // <- wired via theme.colors.background inline
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Full clearance for floating bottom bar
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginLeft: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
    marginBottom: 6,
    lineHeight: 16,
  },
  themeList: {
    gap: 14,
  },
  themeCard: {
    backgroundColor: '#120F20',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },

  // Mock Hero Card
  mockHeroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mockHeroGradient: {
    padding: 14,
    position: 'relative',
  },
  mockSpecularLine: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  mockHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mockPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mockHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mockModeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mockModeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  mockBalance: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },

  // Details
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 12,
  },
  themeTextCol: {
    flex: 1,
    gap: 2,
  },
  themeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  themeTagline: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
