import React, { ReactNode } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { CategoryProvider } from '../../context/CategoryContext';
import { TransactionProvider } from '../../context/TransactionContext';
import { BudgetProvider } from '../../context/BudgetContext';

/**
 * Wraps the entire app in all context providers.
 * Order matters: Auth → Settings → Categories → Transactions → Budgets
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CategoryProvider>
          <TransactionProvider>
            <BudgetProvider>{children}</BudgetProvider>
          </TransactionProvider>
        </CategoryProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
