import React, { ReactNode } from 'react';
import { SettingsProvider } from '../../context/SettingsContext';
import { CategoryProvider } from '../../context/CategoryContext';
import { TransactionProvider } from '../../context/TransactionContext';
import { BudgetProvider } from '../../context/BudgetContext';

/**
 * Wraps the entire app in all context providers.
 * Order matters: Settings → Categories → Transactions → Budgets
 * (Settings needed by all; Categories needed before Transactions for seeding)
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <CategoryProvider>
        <TransactionProvider>
          <BudgetProvider>{children}</BudgetProvider>
        </TransactionProvider>
      </CategoryProvider>
    </SettingsProvider>
  );
}
