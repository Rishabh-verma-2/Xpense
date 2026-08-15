import { Platform } from 'react-native';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  // Parse YYYY-MM-DD into local start & end boundaries
  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

  const start = new Date(sYear, (sMonth || 1) - 1, sDay || 1, 0, 0, 0, 0);
  const end = new Date(eYear, (eMonth || 1) - 1, eDay || 1, 23, 59, 59, 999);

  return transactions.filter((t) => {
    if (t.deletedAt) return false;
    const tDate = new Date(t.date);
    if (isNaN(tDate.getTime())) return false;
    return tDate >= start && tDate <= end;
  });
}

/**
 * Generates and AUTOMATICALLY DOWNLOADS a clean, luxury PDF Financial Statement.
 * - On Web / PWA: Automatically triggers browser file download (e.g. Xpense_Statement_2026-08-15.pdf) with NO print dialog.
 * - On Native Mobile (iOS / Android): Saves to filesystem and opens native share sheet.
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

  // 1. Calculate Financial Summary
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
      rawDate: txDate.getTime() || 0,
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

  const filename = `Xpense_Statement_${startDate}_to_${endDate}.pdf`;

  // 2. Initialize jsPDF Document (A4 format)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;

  // ─── Header Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setFillColor(124, 58, 237); // Purple accent line
  doc.rect(0, 41, pageWidth, 1.5, 'F');

  // Brand Logo Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('XPENSE', margin, 18);

  doc.setFontSize(18);
  doc.setTextColor(192, 132, 252);
  doc.text('.', margin + 31, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(196, 181, 253);
  doc.text('EXECUTIVE FINANCIAL STATEMENT', margin, 25);
  doc.text(`Generated: ${generatedDateStr}`, margin, 31);

  // Statement Meta (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Account: ${userName}`, pageWidth - margin, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(`Period: ${startDate} to ${endDate}`, pageWidth - margin, 25, {
    align: 'right',
  });
  doc.text(
    `Total Records: ${cleanTransactions.length}`,
    pageWidth - margin,
    31,
    { align: 'right' }
  );

  // ─── Financial KPI Cards ───────────────────────────────────────────────────
  let currentY = 50;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4; // 4 cards with 3mm gap
  const cardHeight = 20;

  // Card 1: Total Income
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFillColor(16, 185, 129); // Green bar
  doc.rect(margin, currentY, cardWidth, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INCOME', margin + 3, currentY + 6.5);
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(
    formatCurrency(totalIncome, 'INR', currencySymbol),
    margin + 3,
    currentY + 14.5
  );

  // Card 2: Total Expenses
  const card2X = margin + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFillColor(239, 68, 68); // Red bar
  doc.rect(card2X, currentY, cardWidth, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL EXPENSES', card2X + 3, currentY + 6.5);
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text(
    formatCurrency(totalExpense, 'INR', currencySymbol),
    card2X + 3,
    currentY + 14.5
  );

  // Card 3: Net Balance
  const card3X = card2X + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFillColor(124, 58, 237); // Purple bar
  doc.rect(card3X, currentY, cardWidth, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NET BALANCE', card3X + 3, currentY + 6.5);
  doc.setFontSize(11);
  doc.setTextColor(netBalance >= 0 ? 5 : 220, netBalance >= 0 ? 150 : 38, netBalance >= 0 ? 105 : 38);
  doc.text(
    formatCurrency(netBalance, 'INR', currencySymbol),
    card3X + 3,
    currentY + 14.5
  );

  // Card 4: Savings Rate
  const card4X = card3X + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFillColor(59, 130, 246); // Blue bar
  doc.rect(card4X, currentY, cardWidth, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SAVINGS RATE', card4X + 3, currentY + 6.5);
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(`${savingsRate}%`, card4X + 3, currentY + 14.5);

  currentY += cardHeight + 8;

  // ─── Category Summary Table ────────────────────────────────────────────────
  const sortedCategories = Object.values(categoryTotals).sort(
    (a, b) => b.amount - a.amount
  );

  if (sortedCategories.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Category Summary Breakdown', margin, currentY);
    currentY += 3;

    const categoryTableData = sortedCategories.map((cat) => [
      cat.name,
      cat.type.toUpperCase(),
      cat.count.toString(),
      formatCurrency(cat.amount, 'INR', currencySymbol),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Type', 'Count', 'Total Amount']],
      body: categoryTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      styles: {
        cellPadding: 2.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor =
            data.cell.raw === 'INCOME' ? [5, 150, 105] : [220, 38, 38];
        }
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // ─── Itemized Transaction Ledger ───────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Itemized Transaction Ledger (${cleanTransactions.length} Records)`,
    margin,
    currentY
  );
  currentY += 3;

  const sortedTxList = [...cleanTransactions].sort(
    (a, b) => b.rawDate - a.rawDate
  );

  const transactionTableData =
    sortedTxList.length > 0
      ? sortedTxList.map((t) => [
          t.dateFormatted,
          t.categoryName,
          t.paymentMethod,
          t.notes,
          t.amountFormatted,
        ])
      : [['—', 'No records found for selected period', '—', '—', '—']];

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Category', 'Method', 'Notes / Memo', 'Amount']],
    body: transactionTableData,
    theme: 'striped',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [71, 85, 105],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      cellPadding: 2.6,
      lineColor: [241, 245, 249],
      lineWidth: 0.1,
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw || '');
        data.cell.styles.textColor = text.startsWith('+')
          ? [5, 150, 105]
          : [220, 38, 38];
      }
    },
    margin: { left: margin, right: margin, bottom: 16 },
  });

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Generated automatically by Xpense Finance Companion • Confidential & Personal',
      margin,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    );
  }

  // ─── Web / PWA Direct Automatic Download Flow ────────────────────────────────
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      doc.save(filename);
      return filename;
    }
  }

  // ─── Native (iOS/Android) Save & Share Sheet Flow ────────────────────────────
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save Financial Statement PDF',
      UTI: 'com.adobe.pdf',
    });
  }

  return fileUri;
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
