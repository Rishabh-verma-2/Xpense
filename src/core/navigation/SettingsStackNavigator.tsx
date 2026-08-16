import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import CategoryManagementScreen from '../../features/categories/screens/CategoryManagementScreen';
import AddEditCategoryScreen from '../../features/categories/screens/AddEditCategoryScreen';
import CurrencySettingsScreen from '../../features/settings/screens/CurrencySettingsScreen';
import NotificationSettingsScreen from '../../features/settings/screens/NotificationSettingsScreen';
import AboutScreen from '../../features/settings/screens/AboutScreen';
import ExportScreen from '../../features/export/screens/ExportScreen';
import FeedbackScreen from '../../features/settings/screens/FeedbackScreen';
import HelpFaqScreen from '../../features/settings/screens/HelpFaqScreen';
import ThemeSettingsScreen from '../../features/settings/screens/ThemeSettingsScreen';
import { colors } from '../theme';

import { SettingsStackParamList } from './types';
export type { SettingsStackParamList };

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'default',
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
      <Stack.Screen
        name="AddEditCategory"
        component={AddEditCategoryScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen name="CurrencySettings" component={CurrencySettingsScreen} />
      <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="HelpFaq" component={HelpFaqScreen} />
    </Stack.Navigator>
  );
}
