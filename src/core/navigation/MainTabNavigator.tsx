import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography } from '../theme';
import { HistoryStackNavigator } from './HistoryStackNavigator';
import { ReportsStackNavigator } from './ReportsStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import DashboardScreen from '../../features/dashboard/screens/DashboardScreen';
import BudgetsScreen from '../../features/budgets/screens/BudgetsScreen';
import { useAppTheme } from '../../context/ThemeContext';
import { MainTabParamList } from './types';

export type { MainTabParamList };

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_CONFIG = [
  { name: 'DashboardTab', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { name: 'HistoryTab', label: 'History', icon: 'list', iconOutline: 'list-outline' },
  { name: 'ReportsTab', label: 'Reports', icon: 'bar-chart', iconOutline: 'bar-chart-outline' },
  { name: 'BudgetsTab', label: 'Budgets', icon: 'wallet', iconOutline: 'wallet-outline' },
  { name: 'SettingsTab', label: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
] as const;

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const tc = theme.colors;
  const bottomOffset = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View
        style={[
          styles.glassOuter,
          {
            backgroundColor: tc.navBarBackground,
            borderColor: tc.navBarBorder,
            shadowOpacity: theme.mode === 'light' ? 0.12 : 0.55,
          },
        ]}
      >
        <LinearGradient
          colors={[tc.card, tc.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.glassGradient}
        >
          {/* Specular Top Highlight */}
          <View style={[styles.specularRim, { backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255, 255, 255, 0.3)' }]} />

          <View style={styles.tabRow}>
            {state.routes.map((route: any, index: number) => {
              const isFocused = state.index === index;
              const config = TAB_CONFIG.find((t) => t.name === route.name);
              if (!config) return null;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.tabItem}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={config.label}
                  accessibilityState={{ selected: isFocused }}
                >
                  {isFocused ? (
                    <LinearGradient
                      colors={[
                        `${theme.accentColor}33`,
                        `${tc.primary}18`,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.activeIconPill, { borderColor: tc.cardBorderActive }]}
                    >
                      <Ionicons
                        name={config.icon as any}
                        size={21}
                        color={theme.accentColor}
                      />
                    </LinearGradient>
                  ) : (
                    <View style={styles.inactiveIconWrapper}>
                      <Ionicons
                        name={config.iconOutline as any}
                        size={21}
                        color={tc.textMuted}
                      />
                    </View>
                  )}

                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused
                        ? [styles.tabLabelActive, { color: theme.accentColor }]
                        : [styles.tabLabelInactive, { color: tc.textMuted }],
                    ]}
                  >
                    {config.label}
                  </Text>

                  {/* Micro active glow indicator */}
                  {isFocused ? (
                    <View style={[styles.activeIndicatorDot, { backgroundColor: theme.accentColor }]} />
                  ) : (
                    <View style={styles.inactiveIndicatorPlaceholder} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 100,
  },
  glassOuter: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 20,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }
      : {}),
  },
  glassGradient: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    position: 'relative',
  },
  specularRim: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  activeIconPill: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  inactiveIconWrapper: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...typography.label,
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  tabLabelInactive: {
    fontWeight: '500',
  },
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  inactiveIndicatorPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
});

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      backBehavior="none"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} />
      <Tab.Screen name="HistoryTab" component={HistoryStackNavigator} />
      <Tab.Screen name="ReportsTab" component={ReportsStackNavigator} />
      <Tab.Screen name="BudgetsTab" component={BudgetsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}
