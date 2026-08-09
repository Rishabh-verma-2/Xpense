import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MonthlyReportScreen from '../../features/reports/screens/MonthlyReportScreen';
import YearlyReportScreen from '../../features/reports/screens/YearlyReportScreen';
import CategoryDrilldownScreen from '../../features/reports/screens/CategoryDrilldownScreen';
import { colors } from '../theme';

import { ReportsStackParamList } from './types';
export type { ReportsStackParamList };

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export function ReportsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'default',
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} />
      <Stack.Screen name="YearlyReport" component={YearlyReportScreen} />
      <Stack.Screen name="CategoryDrilldown" component={CategoryDrilldownScreen} />
    </Stack.Navigator>
  );
}
