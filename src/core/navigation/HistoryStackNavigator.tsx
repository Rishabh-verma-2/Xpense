import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../../features/history/screens/HistoryScreen';
import TransactionDetailScreen from '../../features/transactions/screens/TransactionDetailScreen';
import EditTransactionScreen from '../../features/transactions/screens/EditTransactionScreen';
import { useAppTheme } from '../../context/ThemeContext';

import { HistoryStackParamList } from './types';
export type { HistoryStackParamList };

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryStackNavigator() {
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
      <Stack.Screen name="HistoryList" component={HistoryScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen
        name="EditTransaction"
        component={EditTransactionScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
