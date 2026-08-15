import { Platform } from 'react-native';
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
 * Generates and shares/downloads a PDF Financial Statement.
 * Cross-platform: On Web/PWA opens print/save-as-PDF dialog; on native uses Print.printToFileAsync + Sharing.
 */
export async function generateAndSharePDF(
  transactions: Transaction[],
  options: ExportFilterOptions
): Promise<string> {
  const { startDate, endDate, currencySymbol = '₹', userName = 'Xpense User' } = options;

  // Calculate Summary Metrics
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: Record<string, { name: string; type: string; amount: number; count: number }> = {};

  transactions.forEach((t) => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }

    const catKey = `${t.categoryNameSnapshot || 'General'}_${t.type}`;
    if (!categoryTotals[catKey]) {
      categoryTotals[catKey] = {
        name: t.categoryNameSnapshot || 'General',
        type: t.type,
        amount: 0,
        count: 0,
      };
    }
    categoryTotals[catKey].amount += t.amount;
    categoryTotals[catKey].count += 1;
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Category Summary Rows
  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);
  const maxCategoryAmount = sortedCategories.length > 0 ? Math.max(...sortedCategories.map(c => c.amount)) : 1;

  const categoryRowsHTML = sortedCategories
    .map((cat) => {
      const percentage = Math.min(100, Math.round((cat.amount / maxCategoryAmount) * 100));
      const isInc = cat.type === 'income';
      const badgeBg = isInc ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
      const badgeColor = isInc ? '#059669' : '#DC2626';
      const barColor = isInc ? '#10B981' : '#EF4444';

      return `
        <tr>
          <td style="padding: 12px 14px; border-bottom: 1px solid #F1F5F9;">
            <div style="font-weight: 700; color: #0F172A; font-size: 13px;">${cat.name}</div>
            <div style="background: #E2E8F0; border-radius: 4px; height: 5px; width: 100%; max-width: 140px; margin-top: 5px; overflow: hidden;">
              <div style="background: ${barColor}; height: 100%; width: ${percentage}%; border-radius: 4px;"></div>
            </div>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #F1F5F9;">
            <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
              ${cat.type}
            </span>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #F1F5F9; text-align: center; color: #64748B; font-weight: 600; font-size: 13px;">
            ${cat.count}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 800; color: ${badgeColor}; font-size: 14px;">
            ${formatCurrency(cat.amount, 'INR', currencySymbol)}
          </td>
        </tr>
      `;
    })
    .join('');

  // Itemized Transactions Rows
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const transactionRowsHTML = sortedTransactions
    .map((t, idx) => {
      const formattedDate = new Date(t.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const isExpense = t.type === 'expense';
      const amountStr = `${isExpense ? '-' : '+'}${formatCurrency(t.amount, 'INR', currencySymbol)}`;
      const amountColor = isExpense ? '#DC2626' : '#059669';
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

      return `
        <tr style="background-color: ${rowBg};">
          <td style="padding: 11px 14px; border-bottom: 1px solid #F1F5F9; color: #475569; font-size: 12px; white-space: nowrap;">
            ${formattedDate}
          </td>
          <td style="padding: 11px 14px; border-bottom: 1px solid #F1F5F9; font-weight: 700; color: #1E293B; font-size: 13px;">
            ${t.categoryNameSnapshot || 'General'}
          </td>
          <td style="padding: 11px 14px; border-bottom: 1px solid #F1F5F9;">
            <span style="background: #EDE9FE; color: #6D28D9; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
              ${t.paymentMethod || 'cash'}
            </span>
          </td>
          <td style="padding: 11px 14px; border-bottom: 1px solid #F1F5F9; color: #64748B; font-size: 12px; max-width: 220px;">
            ${t.notes || '—'}
          </td>
          <td style="padding: 11px 14px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 800; color: ${amountColor}; font-size: 13px; white-space: nowrap;">
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
        <title>Financial Statement — Xpense</title>
        <style>
          @page {
            size: A4;
            margin: 14mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            background-color: #FFFFFF;
            margin: 0;
            padding: 24px;
          }
          .header-banner {
            background: linear-gradient(135deg, #1E1B4B 0%, #311042 100%);
            border-radius: 16px;
            padding: 28px 24px;
            color: #FFFFFF;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand-logo-title {
            font-size: 30px;
            font-weight: 900;
            color: #FFFFFF;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .brand-logo-title span {
            color: #C084FC;
          }
          .brand-subtitle {
            font-size: 12px;
            color: #C4B5FD;
            margin-top: 4px;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
          .statement-meta {
            text-align: right;
          }
          .statement-tag {
            display: inline-block;
            background: rgba(192, 132, 252, 0.2);
            border: 1px solid rgba(192, 132, 252, 0.4);
            color: #E9D5FF;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .meta-line {
            font-size: 12px;
            color: #E2E8F0;
            margin-top: 3px;
          }

          /* Metrics Summary Cards */
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 28px;
          }
          .metric-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 16px 14px;
          }
          .metric-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #64748B;
            margin-bottom: 6px;
          }
          .metric-value {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }

          /* Section Headings */
          .section-title {
            font-size: 15px;
            font-weight: 800;
            color: #0F172A;
            margin-top: 24px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #E2E8F0;
          }
          th {
            background-color: #F1F5F9;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 11px 14px;
            text-align: left;
            border-bottom: 1px solid #E2E8F0;
          }
          th.text-right {
            text-align: right;
          }
          .footer-note {
            margin-top: 36px;
            padding-top: 14px;
            border-top: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94A3B8;
          }
        </style>
      </head>
      <body>
        <!-- Header Banner -->
        <div class="header-banner">
          <div>
            <h1 class="brand-logo-title">Xpense<span>.</span></h1>
            <div class="brand-subtitle">Executive Financial Statement</div>
          </div>
          <div class="statement-meta">
            <div class="statement-tag">Official Report</div>
            <div class="meta-line"><strong>Account:</strong> ${userName}</div>
            <div class="meta-line"><strong>Period:</strong> ${startDate} — ${endDate}</div>
            <div class="meta-line"><strong>Generated:</strong> ${generatedDate}</div>
          </div>
        </div>

        <!-- Metrics KPI Cards -->
        <div class="metrics-grid">
          <div class="metric-card" style="border-top: 3px solid #10B981;">
            <div class="metric-label">Total Income</div>
            <div class="metric-value" style="color: #059669;">
              ${formatCurrency(totalIncome, 'INR', currencySymbol)}
            </div>
          </div>

          <div class="metric-card" style="border-top: 3px solid #EF4444;">
            <div class="metric-label">Total Expenses</div>
            <div class="metric-value" style="color: #DC2626;">
              ${formatCurrency(totalExpense, 'INR', currencySymbol)}
            </div>
          </div>

          <div class="metric-card" style="border-top: 3px solid #7C3AED;">
            <div class="metric-label">Net Balance</div>
            <div class="metric-value" style="color: ${netBalance >= 0 ? '#059669' : '#DC2626'};">
              ${formatCurrency(netBalance, 'INR', currencySymbol)}
            </div>
          </div>

          <div class="metric-card" style="border-top: 3px solid #3B82F6;">
            <div class="metric-label">Savings Rate</div>
            <div class="metric-value" style="color: #2563EB;">
              ${savingsRate}% <span style="font-size: 11px; font-weight: 600; color: #64748B;">(${transactions.length} items)</span>
            </div>
          </div>
        </div>

        <!-- Category Breakdown -->
        ${
          sortedCategories.length > 0
            ? `
          <div class="section-title">📊 Category Summary</div>
          <table>
            <thead>
              <tr>
                <th>Category & Distribution</th>
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

        <!-- Itemized Transaction Ledger -->
        <div class="section-title">📝 Itemized Ledger (${transactions.length} Records)</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Method</th>
              <th>Notes</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              transactionRowsHTML ||
              '<tr><td colspan="5" style="text-align: center; padding: 24px; color: #94A3B8;">No transactions found for this period.</td></tr>'
            }
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer-note">
          <div>Generated by Xpense Finance Companion • Confidential & Personal</div>
          <div>Report Hash: XP-${Date.now().toString(36).toUpperCase()}</div>
        </div>
      </body>
    </html>
  `;

  // ─── Web / PWA Flow ──────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    try {
      await Print.printAsync({ html: htmlContent });
      return 'web_print_success';
    } catch (err: any) {
      // Fallback: Open a clean printable window
      if (typeof window !== 'undefined') {
        const printWin = window.open('', '_blank');
        if (printWin) {
          printWin.document.write(htmlContent);
          printWin.document.close();
          printWin.focus();
          setTimeout(() => printWin.print(), 500);
          return 'web_window_print';
        }
      }
      throw err;
    }
  }

  // ─── Native (iOS/Android) Flow ───────────────────────────────────────────────
  const { uri } = await Print.printToFileAsync({ html: htmlContent });

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
 * Generates and shares a CSV File across Web and Native Mobile
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
    `"${(t.categoryNameSnapshot || 'General').replace(/"/g, '""')}"`,
    t.amount.toString(),
    t.paymentMethod || 'cash',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const filename = `Xpense_Statement_${startDate}_to_${endDate}.csv`;

  // ─── Web Flow: Browser File Download ─────────────────────────────────────────
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return filename;
    }
  }

  // ─── Native Flow: FileSystem & Share Sheet ──────────────────────────────────
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
