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
 * Filter transactions based on date range (inclusive, timezone-safe)
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  if (!transactions || transactions.length === 0) return [];

  const nonDeleted = transactions.filter((t) => !t.deletedAt);

  if (!startDate || !endDate || startDate === '1970-01-01' || startDate === 'all') {
    return nonDeleted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

  const start = new Date(sYear, (sMonth || 1) - 1, sDay || 1, 0, 0, 0, 0);
  const end = new Date(eYear, (eMonth || 1) - 1, eDay || 1, 23, 59, 59, 999);

  return nonDeleted
    .filter((t) => {
      const tDate = new Date(t.date);
      if (isNaN(tDate.getTime())) return true;
      return tDate >= start && tDate <= end;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Generates and shares a luxury PDF Financial Statement using native expo-print.
 * 100% compatible with React Native Hermes engine (no jspdf / latin1 errors).
 */
export async function generateAndSharePDF(
  transactions: Transaction[],
  options: ExportFilterOptions
): Promise<string> {
  const {
    startDate,
    endDate,
    currencySymbol = '₹',
    userName = 'Xpense User',
  } = options;

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: Record<
    string,
    { name: string; type: string; amount: number; count: number }
  > = {};

  const cleanTransactions = transactions.map((t) => {
    const rawAmount = Number(t.amount) || 0;
    const isIncome = t.type === 'income';
    const catName =
      t.categoryNameSnapshot ||
      (t as any).categoryName ||
      (t as any).category?.name ||
      'General';
    const method = (t.paymentMethod || 'cash').toUpperCase();
    const note = t.notes ? t.notes.trim() : '—';
    const txDate = new Date(t.date);
    const dateFormatted = !isNaN(txDate.getTime())
      ? txDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : t.date;

    if (isIncome) {
      totalIncome += rawAmount;
    } else {
      totalExpense += rawAmount;
    }

    const catKey = `${catName}_${t.type}`;
    if (!categoryTotals[catKey]) {
      categoryTotals[catKey] = {
        name: catName,
        type: t.type,
        amount: 0,
        count: 0,
      };
    }
    categoryTotals[catKey].amount += rawAmount;
    categoryTotals[catKey].count += 1;

    return {
      dateFormatted,
      categoryName: catName,
      type: t.type,
      paymentMethod: method,
      notes: note,
      amount: rawAmount,
      amountFormatted: `${isIncome ? '+' : '-'}${formatCurrency(rawAmount, 'INR', currencySymbol)}`,
    };
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  const generatedDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Generate HTML Template for High-End PDF Statement
  const rowsHtml = cleanTransactions
    .map(
      (tx, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#13111C' : '#0F0D17'}; border-bottom: 1px solid rgba(255,255,255,0.04);">
      <td style="padding: 10px 12px; color: #E2E8F0; font-size: 11px;">${tx.dateFormatted}</td>
      <td style="padding: 10px 12px; color: #FFFFFF; font-weight: 600; font-size: 11px;">${tx.categoryName}</td>
      <td style="padding: 10px 12px; color: #94A3B8; font-size: 10px; text-transform: uppercase;">${tx.paymentMethod}</td>
      <td style="padding: 10px 12px; color: #94A3B8; font-size: 11px;">${tx.notes}</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: 700; font-size: 12px; color: ${tx.type === 'income' ? '#10B981' : '#F43F5E'};">
        ${tx.amountFormatted}
      </td>
    </tr>
  `
    )
    .join('');

  const catRowsHtml = Object.values(categoryTotals)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map(
      (cat) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed rgba(255,255,255,0.06);">
      <span style="font-size: 11px; color: #CBD5E1;">${cat.name} (${cat.count} txns)</span>
      <span style="font-size: 12px; font-weight: 700; color: ${cat.type === 'income' ? '#10B981' : '#F43F5E'};">
        ${cat.type === 'income' ? '+' : '-'}${formatCurrency(cat.amount, 'INR', currencySymbol)}
      </span>
    </div>
  `
    )
    .join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Xpense Statement</title>
    <style>
      @page { margin: 16mm 14mm; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #0B0A12;
        color: #F8FAFC;
        margin: 0;
        padding: 0;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 2px solid #7C3AED;
      }
      .logo-title {
        font-size: 26px;
        font-weight: 900;
        letter-spacing: -0.5px;
        color: #FFFFFF;
        margin: 0;
      }
      .logo-title span { color: #A855F7; }
      .meta { text-align: right; font-size: 11px; color: #94A3B8; }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin: 20px 0;
      }
      .card {
        background: #141222;
        border: 1px solid rgba(168,85,247,0.2);
        border-radius: 10px;
        padding: 12px;
        text-align: center;
      }
      .card-label { font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight: 600; }
      .card-val { font-size: 16px; font-weight: 800; margin-top: 4px; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
        border-radius: 8px;
        overflow: hidden;
      }
      th {
        background: #1E1B2E;
        color: #C084FC;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid rgba(168,85,247,0.3);
      }
      .footer {
        margin-top: 24px;
        text-align: center;
        font-size: 10px;
        color: #64748B;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="logo-title">Xpense<span>.</span></h1>
        <div style="font-size: 12px; color: #C084FC; font-weight: 600; margin-top: 2px;">Financial Statement Report</div>
      </div>
      <div class="meta">
        <div><strong>Account:</strong> ${userName}</div>
        <div><strong>Period:</strong> ${startDate} to ${endDate}</div>
        <div><strong>Generated:</strong> ${generatedDateStr}</div>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card">
        <div class="card-label">Total Inflow</div>
        <div class="card-val" style="color: #10B981;">+${formatCurrency(totalIncome, 'INR', currencySymbol)}</div>
      </div>
      <div class="card">
        <div class="card-label">Total Outflow</div>
        <div class="card-val" style="color: #F43F5E;">-${formatCurrency(totalExpense, 'INR', currencySymbol)}</div>
      </div>
      <div class="card">
        <div class="card-label">Net Balance</div>
        <div class="card-val" style="color: ${netBalance >= 0 ? '#38BDF8' : '#F43F5E'};">${formatCurrency(netBalance, 'INR', currencySymbol)}</div>
      </div>
      <div class="card">
        <div class="card-label">Savings Rate</div>
        <div class="card-val" style="color: #F59E0B;">${savingsRate}%</div>
      </div>
    </div>

    ${
      catRowsHtml
        ? `
    <div style="background: #141222; border: 1px solid rgba(168,85,247,0.15); border-radius: 10px; padding: 14px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #E2E8F0; margin-bottom: 8px;">Top Categories Summary</div>
      ${catRowsHtml}
    </div>
    `
        : ''
    }

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Method</th>
          <th>Notes</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 20px; color:#94A3B8;">No transactions found in selected period.</td></tr>'}
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by Xpense Financial Tracker • Built with Privacy First • Page 1 of 1
    </div>
  </body>
  </html>
  `;

  // On Web: Print or Direct View
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return 'printed';
  }

  // On Native Mobile: Print to PDF File & Share
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save Financial Statement PDF',
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
}

/**
 * Generates and shares/downloads a CSV File across Web and Native Mobile
 */
export async function generateAndShareCSV(
  transactions: Transaction[],
  options: ExportFilterOptions
): Promise<string> {
  const { startDate, endDate } = options;

  const headers = [
    'Date',
    'Type',
    'Category',
    'Amount',
    'Payment Method',
    'Notes',
  ];
  const rows = transactions.map((t) => [
    new Date(t.date).toISOString().split('T')[0],
    t.type,
    `"${(t.categoryNameSnapshot || (t as any).categoryName || 'General').replace(/"/g, '""')}"`,
    (Number(t.amount) || 0).toString(),
    t.paymentMethod || 'cash',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
    '\n'
  );
  const filename = `Xpense_Statement_${startDate}_to_${endDate}.csv`;

  // ─── Web Flow: Browser File Download ─────────────────────────────────────────
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
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
