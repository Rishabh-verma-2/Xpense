import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MonthlyReportScreen from '../../features/reports/screens/MonthlyReportScreen';
import YearlyReportScreen from '../../features/reports/screens/YearlyReportScreen';
import CategoryDrilldownScreen from '../../features/reports/screens/CategoryDrilldownScreen';
import { useAppTheme } from '../../context/ThemeContext';

import { ReportsStackParamList } from './types';
export type { ReportsStackParamList };

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export function ReportsStackNavigator() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'default',
        gestureEnabled: true,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      <Stack.Screen name="YearlyReport" component={YearlyReportScreen} />
      <Stack.Screen name="CategoryDrilldown" component={CategoryDrilldownScreen} />
    </Stack.Navigator>
  );
}
