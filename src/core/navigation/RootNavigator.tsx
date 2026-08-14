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
import { useAuth } from '../../context/AuthContext';
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

export default function RootNavigator() {
  const { token, loading } = useAuth();

  // Check if running as an installed PWA (standalone display mode)
  const isPWAStandalone =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    ((typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      ((window.navigator as any)?.standalone === true));

  // Determine initial route:
  // 1. Native mobile (iOS/Android) -> 'Splash'
  // 2. Installed PWA on home screen -> 'Splash' (bypasses landing page)
  // 3. User with saved login session -> 'Splash' (auto-navigates to MainTabs dashboard)
  // 4. First-time web visitors in browser -> 'Landing'
  const getInitialRouteName = (): keyof RootStackParamList => {
    if (Platform.OS !== 'web') return 'Splash';
    if (isPWAStandalone) return 'Splash';
    if (token) return 'Splash';
    return 'Landing';
  };

  if (loading) {
    return null;
  }

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
            <LandingScreen
              onLaunchApp={() => {
                if (token) {
                  navigation.navigate('MainTabs');
                } else {
                  navigation.navigate('Splash');
                }
              }}
            />
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
    </NavigationContainer>
  );
}
