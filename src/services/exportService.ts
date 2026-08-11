import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Transaction } from '../shared/types/transaction.types';
import { formatCurrency } from '../shared/utils/currencyUtils';

export interface ExportFilterOptions {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
  format: 'pdf' | 'csv';
  currencySymbol?: string;
  userName?: string;
}

/**
 * Filter transactions based on date range (inclusive)
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return transactions.filter((t) => {
    if (t.deletedAt) return false;
    const tDate = new Date(t.date);
    return tDate >= start && tDate <= end;
  });
}

/**
 * Generates and shares a PDF Financial Statement
 */
export async function generateAndSharePDF(
  transactions: Transaction[],
  options: ExportFilterOptions
): Promise<string> {
  const { startDate, endDate, currencySymbol = '₹', userName = 'Xpense User' } = options;

  // Calculate Summary
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: Record<string, { name: string; type: string; amount: number; count: number }> = {};

  transactions.forEach((t) => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }

    const catKey = `${t.categoryNameSnapshot}_${t.type}`;
    if (!categoryTotals[catKey]) {
      categoryTotals[catKey] = {
        name: t.categoryNameSnapshot,
        type: t.type,
        amount: 0,
        count: 0,
      };
    }
    categoryTotals[catKey].amount += t.amount;
    categoryTotals[catKey].count += 1;
  });

  const netBalance = totalIncome - totalExpense;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Category Summary Rows
  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);
  const categoryRowsHTML = sortedCategories
    .map(
      (cat) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #1E293B;">
          ${cat.name}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-transform: capitalize; color: ${
          cat.type === 'income' ? '#059669' : '#DC2626'
        }; font-weight: 600;">
          ${cat.type}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #64748B;">
          ${cat.count}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: ${
          cat.type === 'income' ? '#059669' : '#1E293B'
        };">
          ${formatCurrency(cat.amount, 'INR', currencySymbol)}
        </td>
      </tr>
    `
    )
    .join('');

  // Itemized Transactions Rows
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const transactionRowsHTML = sortedTransactions
    .map((t) => {
      const formattedDate = new Date(t.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const isExpense = t.type === 'expense';
      const amountStr = `${isExpense ? '-' : '+'}${formatCurrency(t.amount, 'INR', currencySymbol)}`;
      const amountColor = isExpense ? '#DC2626' : '#059669';

      return `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #475569; font-size: 13px;">
            ${formattedDate}
          </td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; font-weight: 600; color: #1E293B; font-size: 13px;">
            ${t.categoryNameSnapshot}
          </td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B; text-transform: uppercase; font-size: 12px;">
            ${t.paymentMethod}
          </td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B; font-size: 12px; max-width: 200px;">
            ${t.notes || '—'}
          </td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 700; color: ${amountColor}; font-size: 14px;">
            ${amountStr}
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Financial Statement - Xpense</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1E293B;
            background-color: #FFFFFF;
            margin: 0;
            padding: 32px;
          }
          .header-table {
            width: 100%;
            margin-bottom: 28px;
            border-bottom: 2px solid #7C3AED;
            padding-bottom: 20px;
          }
          .brand-title {
            font-size: 28px;
            font-weight: 800;
            color: #7C3AED;
            margin: 0;
          }
          .brand-sub {
            font-size: 13px;
            color: #64748B;
            margin-top: 4px;
          }
          .statement-title {
            font-size: 20px;
            font-weight: 700;
            color: #0F172A;
            text-align: right;
          }
          .meta-text {
            font-size: 12px;
            color: #64748B;
            text-align: right;
            margin-top: 4px;
          }
          /* Summary Grid */
          .summary-container {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 32px;
          }
          .summary-card {
            flex: 1;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 16px;
          }
          .summary-card-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748B;
            margin-bottom: 8px;
          }
          .summary-card-value {
            font-size: 22px;
            font-weight: 800;
          }
          .section-heading {
            font-size: 16px;
            font-weight: 700;
            color: #0F172A;
            margin-top: 28px;
            margin-bottom: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background-color: #F1F5F9;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 14px;
            text-align: left;
            border-bottom: 2px solid #E2E8F0;
          }
          th.text-right {
            text-align: right;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #E2E8F0;
            text-align: center;
            font-size: 11px;
            color: #94A3B8;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <table class="header-table">
          <tr>
            <td style="vertical-align: top;">
              <h1 class="brand-title">Xpense Statement</h1>
              <div class="brand-sub">Personal Financial Report</div>
            </td>
            <td style="vertical-align: top;">
              <div class="statement-title">Account Statement</div>
              <div class="meta-text"><strong>User:</strong> ${userName}</div>
              <div class="meta-text"><strong>Period:</strong> ${startDate} to ${endDate}</div>
              <div class="meta-text"><strong>Generated:</strong> ${generatedDate}</div>
            </td>
          </tr>
        </table>

        <!-- Summary Cards -->
        <div class="summary-container">
          <div class="summary-card" style="border-left: 4px solid #10B981;">
            <div class="summary-card-title">Total Income</div>
            <div class="summary-card-value" style="color: #059669;">
              ${formatCurrency(totalIncome, 'INR', currencySymbol)}
            </div>
          </div>

          <div class="summary-card" style="border-left: 4px solid #EF4444;">
            <div class="summary-card-title">Total Expense</div>
            <div class="summary-card-value" style="color: #DC2626;">
              ${formatCurrency(totalExpense, 'INR', currencySymbol)}
            </div>
          </div>

          <div class="summary-card" style="border-left: 4px solid #7C3AED;">
            <div class="summary-card-title">Net Balance</div>
            <div class="summary-card-value" style="color: ${netBalance >= 0 ? '#059669' : '#DC2626'};">
              ${formatCurrency(netBalance, 'INR', currencySymbol)}
            </div>
          </div>

          <div class="summary-card" style="border-left: 4px solid #3B82F6;">
            <div class="summary-card-title">Total Records</div>
            <div class="summary-card-value" style="color: #1E293B;">
              ${transactions.length}
            </div>
          </div>
        </div>

        <!-- Category Summary Table -->
        ${
          sortedCategories.length > 0
            ? `
          <div class="section-heading">Category Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Type</th>
                <th style="text-align: center;">Count</th>
                <th class="text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRowsHTML}
            </tbody>
          </table>
        `
            : ''
        }

        <!-- Transactions Table -->
        <div class="section-heading">Transaction Details (${transactions.length})</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Method</th>
              <th>Note</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              transactionRowsHTML ||
              '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94A3B8;">No transactions found for this date range.</td></tr>'
            }
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer">
          Generated automatically by Xpense Finance Companion • Confidential & Personal
        </div>
      </body>
    </html>
  `;

  // 1) Print to PDF file
  const { uri } = await Print.printToFileAsync({ html: htmlContent });

  // 2) Share or Save PDF
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Download Financial Statement PDF',
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
}

/**
 * Generates and shares a CSV File
 */
export async function generateAndShareCSV(
  transactions: Transaction[],
  options: ExportFilterOptions
): Promise<string> {
  const { startDate, endDate } = options;

  const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];
  const rows = transactions.map((t) => [
    new Date(t.date).toISOString().split('T')[0],
    t.type,
    `"${(t.categoryNameSnapshot || '').replace(/"/g, '""')}"`,
    t.amount.toString(),
    t.paymentMethod,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const filename = `Xpense_Export_${startDate}_to_${endDate}.csv`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Download CSV Export',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
}
