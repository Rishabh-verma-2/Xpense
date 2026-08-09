import { Transaction } from '../../../shared/types/transaction.types';
import { Category } from '../../../shared/types/category.types';
import { Budget } from '../../../shared/types/budget.types';
import { Statistics, CategoryBreakdownItem, DailyTrendItem } from '../../../shared/types/settings.types';
import { getMonthKey, getYearKey, startOfMonth, endOfMonth } from '../../../shared/utils/dateUtils';

// ── Monthly Statistics ───────────────────────────────────────────────────────

export function computeMonthlyStats(
  transactions: Transaction[],
  monthKey: string,
  prevMonthTransactions: Transaction[],
): Statistics {
  const inMonth = transactions.filter(
    (t) => getMonthKey(t.date) === monthKey && !t.deletedAt,
  );

  const totalIncome = inMonth
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = inMonth
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : null;

  const categoryBreakdown = computeCategoryBreakdown(
    inMonth.filter((t) => t.type === 'expense'),
  );

  const dailyTrend = computeDailyTrend(inMonth, monthKey);

  // Comparison
  const prevIncome = prevMonthTransactions
    .filter((t) => t.type === 'income' && !t.deletedAt)
    .reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = prevMonthTransactions
    .filter((t) => t.type === 'expense' && !t.deletedAt)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    period: monthKey,
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    categoryBreakdown,
    dailyTrend,
    comparisonToPreviousPeriod: {
      incomeChangePercent:
        prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null,
      expenseChangePercent:
        prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : null,
    },
  };
}

// ── Yearly Statistics ────────────────────────────────────────────────────────

export interface MonthlyTotal {
  month: string; // YYYY-MM
  income: number;
  expense: number;
}

export function computeYearlyTotals(
  transactions: Transaction[],
  year: string,
): MonthlyTotal[] {
  const months: MonthlyTotal[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthKey = `${year}-${String(m).padStart(2, '0')}`;
    const inMonth = transactions.filter(
      (t) => getMonthKey(t.date) === monthKey && !t.deletedAt,
    );
    months.push({
      month: monthKey,
      income: inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }
  return months;
}

// ── Category Breakdown ───────────────────────────────────────────────────────

export function computeCategoryBreakdown(
  expenseTransactions: Transaction[],
): CategoryBreakdownItem[] {
  const total = expenseTransactions.reduce((s, t) => s + t.amount, 0);
  const map = new Map<
    string,
    { name: string; color: string; icon: string; amount: number }
  >();

  for (const t of expenseTransactions) {
    const existing = map.get(t.categoryId);
    if (existing) {
      existing.amount += t.amount;
    } else {
      map.set(t.categoryId, {
        name: t.categoryNameSnapshot,
        color: t.categoryColorSnapshot,
        icon: t.categoryIconSnapshot,
        amount: t.amount,
      });
    }
  }

  return Array.from(map.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      categoryColor: data.color,
      categoryIcon: data.icon,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ── Daily Trend ──────────────────────────────────────────────────────────────

function computeDailyTrend(transactions: Transaction[], monthKey: string): DailyTrendItem[] {
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = new Map<string, number>();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`;
    dayMap.set(dateStr, 0);
  }

  for (const t of transactions.filter((t) => t.type === 'expense')) {
    const dateStr = t.date.slice(0, 10);
    dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + t.amount);
  }

  return Array.from(dayMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Budget Calculations ──────────────────────────────────────────────────────

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
}

export function computeBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string,
): BudgetProgress[] {
  const monthExpenses = transactions.filter(
    (t) => getMonthKey(t.date) === monthKey && t.type === 'expense' && !t.deletedAt,
  );

  return budgets
    .filter((b) => b.month === monthKey)
    .map((budget) => {
      const spent = budget.categoryId
        ? monthExpenses
            .filter((t) => t.categoryId === budget.categoryId)
            .reduce((s, t) => s + t.amount, 0)
        : monthExpenses.reduce((s, t) => s + t.amount, 0); // overall budget

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = Math.max(budget.amount - spent, 0);

      return {
        budget,
        spent,
        remaining,
        percentage,
        status:
          percentage >= 100
            ? 'danger'
            : percentage >= 70
            ? 'warning'
            : 'safe',
      } as BudgetProgress;
    });
}
