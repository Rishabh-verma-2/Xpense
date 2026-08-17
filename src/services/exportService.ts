import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../shared/types/transaction.types';
import { formatCurrency } from '../shared/utils/currencyUtils';

export interface ExportFilterOptions {
  startDate: string; // ISO date string (YYYY-MM-DD) or 'All_Time'
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

  if (!startDate || !endDate || startDate === '1970-01-01' || startDate === 'all' || startDate === 'All_Time') {
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
 * Generates and downloads/shares a Luxury Executive PDF Financial Statement.
 * On Web: Generates direct vector PDF with jsPDF and triggers direct file download (NO browser print dialog).
 * On Native Mobile: Uses expo-print to compile PDF file and expo-sharing to save/share.
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

  const displayPeriod = startDate === 'All_Time' || startDate === '1970-01-01' ? `All Time (up to ${endDate})` : `${startDate} to ${endDate}`;
  const filename = `Xpense_Statement_${startDate}_to_${endDate}.pdf`;

  // ══════════════════════════════════════════════════════════════════════════════
  // WEB FLOW: Direct Vector PDF Download using jsPDF & autoTable
  // (Directly downloads the PDF file without opening browser print / save-as dialog)
  // ══════════════════════════════════════════════════════════════════════════════
  if (Platform.OS === 'web') {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // Currency prefix for jsPDF (WinAnsi compatible)
    const pdfCur = currencySymbol === '₹' ? 'Rs. ' : `${currencySymbol} `;

    // ── Header Banner ──
    // Top decorative bar
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(margin, 24, contentWidth, 4, 'F');

    // Title & Logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('XPENSE', margin, 54);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('EXECUTIVE FINANCIAL STATEMENT', margin + 102, 53);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('Comprehensive Cashflow & Transaction Intelligence Report', margin, 68);

    // Meta details (Right side)
    const metaX = pageWidth - margin;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Account: `, metaX - 160, 44);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(userName, metaX, 44, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Period: `, metaX - 160, 56);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(displayPeriod, metaX, 56, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated: `, metaX - 160, 68);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(generatedDateStr, metaX, 68, { align: 'right' });

    // Thin separator
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.8);
    doc.line(margin, 78, pageWidth - margin, 78);

    // ── Executive KPI Cards (4 columns) ──
    const cardY = 88;
    const cardHeight = 48;
    const cardGap = 8;
    const cardWidth = (contentWidth - cardGap * 3) / 4;

    const cardsData = [
      {
        label: 'TOTAL INFLOW',
        val: `+${pdfCur}${totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        bg: [236, 253, 245],
        border: [167, 243, 208],
        textColor: [5, 150, 105], // Green
      },
      {
        label: 'TOTAL OUTFLOW',
        val: `-${pdfCur}${totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        bg: [255, 241, 242],
        border: [254, 205, 211],
        textColor: [225, 29, 72], // Rose
      },
      {
        label: 'NET CASHFLOW',
        val: `${netBalance >= 0 ? '+' : ''}${pdfCur}${netBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        bg: netBalance >= 0 ? [240, 249, 255] : [255, 241, 242],
        border: netBalance >= 0 ? [186, 230, 253] : [254, 205, 211],
        textColor: netBalance >= 0 ? [2, 132, 199] : [225, 29, 72],
      },
      {
        label: 'SAVINGS RATE',
        val: `${savingsRate}% (${transactions.length} txns)`,
        bg: [250, 245, 255],
        border: [233, 213, 255],
        textColor: [124, 58, 237], // Purple
      },
    ];

    cardsData.forEach((card, idx) => {
      const cx = margin + idx * (cardWidth + cardGap);
      doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
      doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
      doc.setLineWidth(0.8);
      doc.roundedRect(cx, cardY, cardWidth, cardHeight, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, cx + cardWidth / 2, cardY + 14, { align: 'center' });

      doc.setFontSize(10.5);
      doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      doc.text(card.val, cx + cardWidth / 2, cardY + 34, { align: 'center' });
    });

    let currentY = cardY + cardHeight + 14;

    // ── Top Categories Breakdown (if any) ──
    const topCategories = Object.values(categoryTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    if (topCategories.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('CATEGORY SUMMARY BREAKDOWN', margin, currentY);
      currentY += 6;

      const totalBase = totalExpense > 0 ? totalExpense : (totalIncome > 0 ? totalIncome : 1);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Category', 'Type', 'Count', 'Total Amount', '% Share']],
        body: topCategories.map((c) => [
          c.name,
          c.type.toUpperCase(),
          `${c.count} txns`,
          `${c.type === 'income' ? '+' : '-'}${pdfCur}${c.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          `${Math.round((c.amount / totalBase) * 100)}%`,
        ]),
        theme: 'plain',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [71, 85, 105],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 4,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85],
          cellPadding: 3.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 160, fontStyle: 'bold' },
          1: { cellWidth: 70 },
          2: { cellWidth: 65, halign: 'center' },
          3: { cellWidth: 130, halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: 80, halign: 'right' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 16;
    }

    // ── Detailed Transactions Ledger Table ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('DETAILED TRANSACTION LEDGER', margin, currentY);
    currentY += 6;

    const tableRows = cleanTransactions.map((tx) => [
      tx.dateFormatted,
      tx.type.toUpperCase(),
      tx.categoryName,
      tx.paymentMethod,
      tx.notes.length > 38 ? tx.notes.substring(0, 38) + '...' : tx.notes,
      `${tx.type === 'income' ? '+' : '-'}${pdfCur}${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 40 },
      head: [['Date', 'Type', 'Category', 'Method', 'Notes & Description', 'Amount']],
      body: tableRows.length > 0 ? tableRows : [['—', '—', 'No transactions found', '—', '—', '—']],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 27, 75], // Deep Indigo
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 4.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 100, fontStyle: 'bold' },
        3: { cellWidth: 55, halign: 'center' },
        4: { cellWidth: 140 },
        5: { cellWidth: 90, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const rawText = String(data.cell.raw || '');
          if (rawText.startsWith('+')) {
            data.cell.styles.textColor = [5, 150, 105]; // Emerald
          } else if (rawText.startsWith('-')) {
            data.cell.styles.textColor = [225, 29, 72]; // Rose
          }
        }
        if (data.section === 'body' && data.column.index === 1) {
          const rawText = String(data.cell.raw || '');
          if (rawText === 'INCOME') {
            data.cell.styles.textColor = [5, 150, 105];
          } else if (rawText === 'EXPENSE') {
            data.cell.styles.textColor = [225, 29, 72];
          }
        }
      },
    });

    // ── Page Footers & Numbering ──
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.6);
      doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        'Confidential Financial Statement • Powered by Xpense Privacy-First Tracker',
        margin,
        pageHeight - 16
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 16,
        { align: 'right' }
      );
    }

    // Direct Browser Download Trigger
    doc.save(filename);
    return filename;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NATIVE MOBILE FLOW: Clean Executive HTML & Native Print to File + Share
  // ══════════════════════════════════════════════════════════════════════════════
  const rowsHtml = cleanTransactions
    .map(
      (tx, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; border-bottom: 1px solid #E2E8F0;">
      <td style="padding: 8px 10px; color: #475569; font-size: 11px;">${tx.dateFormatted}</td>
      <td style="padding: 8px 10px; font-weight: 700; font-size: 10px; text-transform: uppercase; color: ${tx.type === 'income' ? '#059669' : '#E11D48'};">
        ${tx.type}
      </td>
      <td style="padding: 8px 10px; color: #0F172A; font-weight: 600; font-size: 11px;">${tx.categoryName}</td>
      <td style="padding: 8px 10px; color: #64748B; font-size: 10px; text-transform: uppercase;">${tx.paymentMethod}</td>
      <td style="padding: 8px 10px; color: #475569; font-size: 11px;">${tx.notes}</td>
      <td style="padding: 8px 10px; text-align: right; font-weight: 700; font-size: 12px; color: ${tx.type === 'income' ? '#059669' : '#E11D48'};">
        ${tx.amountFormatted}
      </td>
    </tr>
  `
    )
    .join('');

  const catRowsHtml = Object.values(categoryTotals)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
    .map(
      (cat) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #E2E8F0;">
      <span style="font-size: 11px; color: #334155; font-weight: 600;">${cat.name} (${cat.count} txns)</span>
      <span style="font-size: 12px; font-weight: 700; color: ${cat.type === 'income' ? '#059669' : '#E11D48'};">
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
      @page { margin: 12mm 12mm; size: A4; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #FFFFFF;
        color: #0F172A;
        margin: 0;
        padding: 10px;
      }
      .top-bar {
        height: 4px;
        background: #4F46E5;
        border-radius: 2px;
        margin-bottom: 12px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 12px;
        border-bottom: 1.5px solid #E2E8F0;
      }
      .logo-title {
        font-size: 22px;
        font-weight: 900;
        color: #0F172A;
        margin: 0;
      }
      .logo-title span { color: #4F46E5; }
      .meta { text-align: right; font-size: 11px; color: #64748B; line-height: 1.5; }
      .meta strong { color: #0F172A; }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 16px 0;
      }
      .card {
        border-radius: 6px;
        padding: 10px;
        text-align: center;
        border: 1px solid #E2E8F0;
      }
      .card-label { font-size: 9px; text-transform: uppercase; color: #64748B; font-weight: 700; }
      .card-val { font-size: 14px; font-weight: 800; margin-top: 4px; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid #E2E8F0;
      }
      th {
        background: #1E1B4B;
        color: #FFFFFF;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 8px 10px;
        text-align: left;
      }
      .footer {
        margin-top: 24px;
        text-align: center;
        font-size: 10px;
        color: #94A3B8;
        padding-top: 10px;
        border-top: 1px solid #E2E8F0;
      }
    </style>
  </head>
  <body>
    <div class="top-bar"></div>
    <div class="header">
      <div>
        <h1 class="logo-title">XPENSE<span>.</span></h1>
        <div style="font-size: 11px; color: #4F46E5; font-weight: 700; margin-top: 2px;">EXECUTIVE FINANCIAL STATEMENT</div>
        <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Comprehensive Cashflow & Transaction Report</div>
      </div>
      <div class="meta">
        <div>Account: <strong>${userName}</strong></div>
        <div>Period: <strong>${displayPeriod}</strong></div>
        <div>Generated: <strong>${generatedDateStr}</strong></div>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card" style="background: #ECFDF5; border-color: #A7F3D0;">
        <div class="card-label">Total Inflow</div>
        <div class="card-val" style="color: #059669;">+${formatCurrency(totalIncome, 'INR', currencySymbol)}</div>
      </div>
      <div class="card" style="background: #FFF1F2; border-color: #FECDD3;">
        <div class="card-label">Total Outflow</div>
        <div class="card-val" style="color: #E11D48;">-${formatCurrency(totalExpense, 'INR', currencySymbol)}</div>
      </div>
      <div class="card" style="background: ${netBalance >= 0 ? '#F0F9FF' : '#FFF1F2'}; border-color: ${netBalance >= 0 ? '#BAE6FD' : '#FECDD3'};">
        <div class="card-label">Net Cashflow</div>
        <div class="card-val" style="color: ${netBalance >= 0 ? '#0284C7' : '#E11D48'};">${formatCurrency(netBalance, 'INR', currencySymbol)}</div>
      </div>
      <div class="card" style="background: #FAF5FF; border-color: #E9D5FF;">
        <div class="card-label">Savings Rate</div>
        <div class="card-val" style="color: #7C3AED;">${savingsRate}%</div>
      </div>
    </div>

    ${
      catRowsHtml
        ? `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
      <div style="font-size: 11px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">TOP CATEGORIES SUMMARY</div>
      ${catRowsHtml}
    </div>
    `
        : ''
    }

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Category</th>
          <th>Method</th>
          <th>Notes</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#94A3B8;">No transactions found in selected period.</td></tr>'}
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by Xpense Financial Tracker • Privacy First • Confidential Statement
    </div>
  </body>
  </html>
  `;

  // Print to PDF File & Share
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
