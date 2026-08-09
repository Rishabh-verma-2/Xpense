import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { HistoryStackNavigator } from './HistoryStackNavigator';
import { ReportsStackNavigator } from './ReportsStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import DashboardScreen from '../../features/dashboard/screens/DashboardScreen';
import BudgetsScreen from '../../features/budgets/screens/BudgetsScreen';

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

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 4 }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG.find((t) => t.name === route.name);
        if (!config) return null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={config.label}
          >
            <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
              <Ionicons
                name={(isFocused ? config.icon : config.iconOutline) as any}
                size={22}
                color={isFocused ? colors.primary : colors.textMuted}
              />
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 10,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrapper: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryMuted,
  },
  tabLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  tabLabelActive: {
    color: colors.primary,
  },
});

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
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
