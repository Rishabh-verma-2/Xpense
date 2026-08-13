import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import SplashScreen from '../../features/onboarding/screens/SplashScreen';
import OnboardingScreen from '../../features/onboarding/screens/OnboardingScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import SignupScreen from '../../features/auth/screens/SignupScreen';
import NameSetupScreen from '../../features/auth/screens/NameSetupScreen';
import AddTransactionScreen from '../../features/transactions/screens/AddTransactionScreen';
import { LandingScreen } from '../../features/landing/screens/LandingScreen';
import { MobileInstallPrompt } from '../../shared/components/MobileInstallPrompt';
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

const isMobileBrowser =
  Platform.OS === 'web' &&
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');

const getInitialRouteName = (): keyof RootStackParamList => {
  if (Platform.OS !== 'web') return 'Splash';
  // On mobile phone browsers, open the mobile app experience directly!
  if (isMobileBrowser) return 'Splash';
  // On desktop browsers, show the landing page
  return 'Landing';
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={appTheme}>
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          headerShown: false,
          animation: 'default',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Landing">
          {({ navigation }) => (
            <LandingScreen onLaunchApp={() => navigation.navigate('Login')} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="NameSetup" component={NameSetupScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
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

      {/* Automatic Mobile PWA Install Prompt */}
      <MobileInstallPrompt />
    </NavigationContainer>
  );
}
