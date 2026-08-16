import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
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
import { useAppTheme } from '../../context/ThemeContext';
import type { RootStackParamList } from './types';

export type { RootStackParamList };

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Deep Linking & Native Browser History Integration ───────────────────────
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
              Feedback: 'settings/feedback',
              HelpFaq: 'settings/help',
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
  const { theme } = useAppTheme();
  const c = theme.colors;
  const isLight = theme.mode === 'light';

  const navTheme = {
    ...(isLight ? DefaultTheme : DarkTheme),
    colors: {
      ...(isLight ? DefaultTheme.colors : DarkTheme.colors),
      background: c.background,
      card: c.surface,
      text: c.textPrimary,
      border: c.cardBorder,
      primary: c.primary,
    },
  };

  // ─── Hardware Back Button Handling (Native Android) ──────────────────────
  useEffect(() => {
    const onAndroidBackPress = () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true; // Go back exactly 1 step in stack
      }
      return false; // Exit app only when at root
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onAndroidBackPress
    );

    return () => backHandler.remove();
  }, [navigationRef]);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      linking={linking}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'default',
          contentStyle: { backgroundColor: c.background },
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
