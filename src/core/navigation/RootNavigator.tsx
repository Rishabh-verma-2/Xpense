import React, { useEffect } from 'react';
import { Platform, BackHandler } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import SplashScreen from '../../features/onboarding/screens/SplashScreen';
import OnboardingScreen from '../../features/onboarding/screens/OnboardingScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import SignupScreen from '../../features/auth/screens/SignupScreen';
import NameSetupScreen from '../../features/auth/screens/NameSetupScreen';
import AddTransactionScreen from '../../features/transactions/screens/AddTransactionScreen';
import { LandingScreen } from '../../features/landing/screens/LandingScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

export type { RootStackParamList };

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.cardBorder,
    primary: colors.primary,
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Deep Linking & Browser History Sync Configuration ────────────────────────
const linking = {
  prefixes: ['https://xpense-blush.vercel.app', 'xpense://', '/'],
  config: {
    screens: {
      Splash: 'splash',
      MainTabs: {
        screens: {
          DashboardTab: 'home',
          HistoryTab: {
            screens: {
              HistoryList: 'history',
              TransactionDetail: 'history/detail',
              EditTransaction: 'history/edit',
            },
          },
          ReportsTab: {
            screens: {
              MonthlyReport: 'reports',
              YearlyReport: 'reports/yearly',
              CategoryDrilldown: 'reports/category',
            },
          },
          BudgetsTab: 'budgets',
          SettingsTab: {
            screens: {
              SettingsHome: 'settings',
              CategoryManagement: 'settings/categories',
              AddEditCategory: 'settings/categories/edit',
              CurrencySettings: 'settings/currency',
              NotificationSettings: 'settings/notifications',
              About: 'settings/about',
              Export: 'settings/export',
            },
          },
        },
      },
      Login: 'login',
      Signup: 'signup',
      NameSetup: 'name-setup',
      Onboarding: 'onboarding',
      Landing: 'landing',
      AddTransaction: 'add-transaction',
    },
  },
};

export default function RootNavigator() {
  const navigationRef = useNavigationContainerRef();

  // ─── Hardware & Browser Back Button Handling ──────────────────────────────
  useEffect(() => {
    // 1. Android Native Back Button
    const onAndroidBackPress = () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true; // Prevent default app exit
      }
      return false; // Allow exit on root screen
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onAndroidBackPress
    );

    // 2. Web / PWA Browser Back Button & PopState Listener
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebPopState = () => {
        if (navigationRef.isReady() && navigationRef.canGoBack()) {
          navigationRef.goBack();
        }
      };

      window.addEventListener('popstate', handleWebPopState);
      return () => {
        backHandler.remove();
        window.removeEventListener('popstate', handleWebPopState);
      };
    }

    return () => backHandler.remove();
  }, [navigationRef]);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={appTheme}
      linking={linking}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'default',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="NameSetup" component={NameSetupScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Landing">
          {({ navigation }) => (
            <LandingScreen onLaunchApp={() => navigation.navigate('Login')} />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: 300,
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
