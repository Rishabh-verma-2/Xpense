import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { SettingsStackParamList } from '../../../core/navigation/types';
import { useAppTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { ThemeId, ThemeDefinition } from '../../../core/theme/themes';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'ThemeSettings'>;
};

const THEME_GROUPS = [
  {
    label: 'DARK THEMES',
    ids: ['obsidian', 'emerald', 'sapphire', 'amber', 'rosegold', 'midnight', 'aurora'],
  },
  {
    label: 'LIGHT THEMES',
    ids: ['pearl'],
  },
];

const NEW_THEME_IDS = new Set(['rosegold', 'midnight', 'aurora']);

export default function ThemeSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme, themeId, setThemeId, availableThemes } = useAppTheme();
  const tc = theme.colors;
  const { showSuccess } = useToast();

  const themeMap = new Map(availableThemes.map((t) => [t.id, t]));

  const handleSelectTheme = async (id: ThemeId, name: string) => {
    if (id === themeId) return;
    await setThemeId(id);
    showSuccess('Theme Applied! ✨', `${name} is now active across all screens.`);
  };

  const renderThemeCard = (item: ThemeDefinition) => {
    const isSelected = item.id === themeId;
    const isNew = NEW_THEME_IDS.has(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.themeCard,
          {
            backgroundColor: tc.card,
            borderColor: isSelected ? item.accentColor : tc.cardBorder,
            borderWidth: isSelected ? 1.8 : 1,
          },
        ]}
        onPress={() => handleSelectTheme(item.id, item.name)}
        activeOpacity={0.85}
      >
        {/* Mini Mock Hero */}
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
                <View style={[styles.mockDot, { backgroundColor: item.colors.income }]} />
                <Text style={[styles.mockHeroLabel, { color: item.colors.textSecondary }]}>
                  NET WORTH
                </Text>
              </View>
              <View style={styles.badgeRow}>
                {isNew && (
                  <View style={[styles.newBadge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <View style={[styles.mockModeBadge, { borderColor: item.accentColor }]}>
                  <Text style={[styles.mockModeText, { color: item.accentColor }]}>
                    {item.mode.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.mockBalance, { color: item.colors.textPrimary }]}>
              ₹2,48,500
            </Text>

            {/* Swatch Row */}
            <View style={styles.swatchRow}>
              {item.previewColors.map((col, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.swatchDot,
                    { backgroundColor: col, borderColor: 'rgba(255,255,255,0.2)' },
                  ]}
                />
              ))}
              {/* Mini progress bar preview */}
              <View style={styles.swatchProgressTrack}>
                <View
                  style={[styles.swatchProgressFill, { backgroundColor: item.accentColor, width: '65%' }]}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Theme Info Row */}
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
                ? { borderColor: item.accentColor, backgroundColor: item.accentColor }
                : { borderColor: tc.cardBorder },
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Appearance & Themes" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active theme hero preview */}
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeThemeHero}
        >
          <View style={styles.activeHeroContent}>
            <Text style={styles.activeHeroLabel}>CURRENTLY ACTIVE</Text>
            <Text style={styles.activeHeroName}>{theme.name}</Text>
            <Text style={styles.activeHeroTagline}>{theme.tagline}</Text>
          </View>
          <View style={[styles.activeHeroAccent, { backgroundColor: theme.accentColor }]} />
        </LinearGradient>

        {/* Theme groups */}
        {THEME_GROUPS.map((group) => {
          const groupThemes = group.ids
            .map((id) => themeMap.get(id as ThemeId))
            .filter(Boolean) as ThemeDefinition[];

          if (groupThemes.length === 0) return null;

          return (
            <View key={group.label}>
              <View style={styles.groupHeaderRow}>
                <Text style={[styles.groupLabel, { color: tc.textMuted }]}>{group.label}</Text>
                <View style={[styles.groupLine, { backgroundColor: tc.cardBorder }]} />
              </View>
              <View style={styles.themeList}>
                {groupThemes.map(renderThemeCard)}
              </View>
            </View>
          );
        })}

        <Text style={[styles.footerNote, { color: tc.textMuted }]}>
          🎨 More themes coming soon. Theme selection is saved across app sessions.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 16,
  },

  // Active theme hero
  activeThemeHero: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  activeHeroContent: { flex: 1 },
  activeHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  activeHeroName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  activeHeroTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
  },
  activeHeroAccent: {
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.5,
  },

  // Group header
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: -4,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  groupLine: {
    flex: 1,
    height: 1,
  },

  // Theme list
  themeList: { gap: 12 },
  themeCard: {
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },

  // Mock hero card
  mockHeroCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  mockHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mockModeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
    alignItems: 'center',
    gap: 6,
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  swatchProgressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  swatchProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Theme info
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
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 4,
    lineHeight: 18,
  },
});
