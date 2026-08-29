import React, { ReactNode } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { CategoryProvider } from '../../context/CategoryContext';
import { TransactionProvider } from '../../context/TransactionContext';
import { BudgetProvider } from '../../context/BudgetContext';
import { ToastProvider } from '../../context/ToastContext';
import { ThemeProvider } from '../../context/ThemeContext';

import { NotificationProvider } from '../../context/NotificationContext';

/**
 * Wraps the entire app in all context providers.
 * Order matters: Toast → Theme → Auth → Settings → Notifications → Categories → Transactions → Budgets
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <NotificationProvider>
              <CategoryProvider>
                <TransactionProvider>
                  <BudgetProvider>{children}</BudgetProvider>
                </TransactionProvider>
              </CategoryProvider>
            </NotificationProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}
