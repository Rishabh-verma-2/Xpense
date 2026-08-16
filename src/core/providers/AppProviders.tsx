import React, { ReactNode } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { CategoryProvider } from '../../context/CategoryContext';
import { TransactionProvider } from '../../context/TransactionContext';
import { BudgetProvider } from '../../context/BudgetContext';
import { ToastProvider } from '../../context/ToastContext';
import { ThemeProvider } from '../../context/ThemeContext';

/**
 * Wraps the entire app in all context providers.
 * Order matters: Toast → Theme → Auth → Settings → Categories → Transactions → Budgets
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <CategoryProvider>
              <TransactionProvider>
                <BudgetProvider>{children}</BudgetProvider>
              </TransactionProvider>
            </CategoryProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}
