import PDFDocument from 'pdfkit';

export interface UserReportData {
  userName: string;
  userEmail: string;
  monthName: string; // e.g. "August 2026"
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactions: Array<{
    date: Date | string;
    categoryName: string;
    note?: string;
    paymentMethod: string;
    type: 'income' | 'expense';
    amount: number;
  }>;
}

/**
 * Generates an executive luxury PDF financial statement for a user using PDFKit.
 * Returns a Buffer containing the complete binary PDF.
 */
export async function generateMonthlySpendingPDF(data: UserReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Xpense Financial Statement - ${data.monthName}`,
          Author: 'Xpense Financial Platform',
          Subject: `${data.userName}'s ${data.monthName} Financial Statement`,
          Keywords: 'Finance, Expenses, Budget, Xpense',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#7C3AED'; // Xpense Violet
      const darkBg = '#0B0A14';
      const textLight = '#1E1B4B';
      const textMuted = '#6B7280';
      const successColor = '#059669';
      const dangerColor = '#DC2626';

      // ─── Header Banner ───────────────────────────────────────────────────────
      doc.rect(40, 40, 515, 75).fillAndStroke('#F5F3FF', '#DDD6FE');

      doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold')
         .text('Xpense.', 56, 52);

      doc.fillColor(textLight).fontSize(13).font('Helvetica-Bold')
         .text(`Monthly Financial Statement — ${data.monthName}`, 56, 80);

      doc.fillColor(textMuted).fontSize(9).font('Helvetica')
         .text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 56, 96);

      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
         .text('OFFICIAL RECORD', 430, 56, { align: 'right', width: 110 });

      doc.moveDown(3);

      // ─── Account Holder Card ─────────────────────────────────────────────────
      const userBoxY = 125;
      doc.rect(40, userBoxY, 515, 45).fillAndStroke('#FAFAFA', '#E5E7EB');
      
      doc.fillColor(textMuted).fontSize(8).font('Helvetica-Bold')
         .text('ACCOUNT HOLDER', 54, userBoxY + 10);
      doc.fillColor(textLight).fontSize(11).font('Helvetica-Bold')
         .text(data.userName || 'Valued User', 54, userBoxY + 22);

      doc.fillColor(textMuted).fontSize(8).font('Helvetica-Bold')
         .text('EMAIL ADDRESS', 280, userBoxY + 10);
      doc.fillColor(textLight).fontSize(10).font('Helvetica')
         .text(data.userEmail, 280, userBoxY + 22);

      // ─── KPI Metrics ─────────────────────────────────────────────────────────
      const kpiY = 180;
      const kpiWidth = 120;
      const kpiGap = 11;

      // Card 1: Total Spent
      doc.rect(40, kpiY, kpiWidth, 55).fillAndStroke('#FEF2F2', '#FECACA');
      doc.fillColor(dangerColor).fontSize(8).font('Helvetica-Bold')
         .text('TOTAL SPENT (OUTFLOW)', 48, kpiY + 8);
      doc.fillColor(dangerColor).fontSize(14).font('Helvetica-Bold')
         .text(`Rs. ${data.totalExpense.toLocaleString('en-IN')}`, 48, kpiY + 24);

      // Card 2: Total Income
      doc.rect(40 + kpiWidth + kpiGap, kpiY, kpiWidth, 55).fillAndStroke('#ECFDF5', '#A7F3D0');
      doc.fillColor(successColor).fontSize(8).font('Helvetica-Bold')
         .text('TOTAL INCOME (INFLOW)', 48 + kpiWidth + kpiGap, kpiY + 8);
      doc.fillColor(successColor).fontSize(14).font('Helvetica-Bold')
         .text(`Rs. ${data.totalIncome.toLocaleString('en-IN')}`, 48 + kpiWidth + kpiGap, kpiY + 24);

      // Card 3: Net Cashflow / Savings
      const netBg = data.netSavings >= 0 ? '#EFF6FF' : '#FEF2F2';
      const netBorder = data.netSavings >= 0 ? '#BFDBFE' : '#FECACA';
      const netColor = data.netSavings >= 0 ? '#1D4ED8' : dangerColor;
      doc.rect(40 + (kpiWidth + kpiGap) * 2, kpiY, kpiWidth, 55).fillAndStroke(netBg, netBorder);
      doc.fillColor(netColor).fontSize(8).font('Helvetica-Bold')
         .text('NET CASHFLOW', 48 + (kpiWidth + kpiGap) * 2, kpiY + 8);
      doc.fillColor(netColor).fontSize(14).font('Helvetica-Bold')
         .text(`${data.netSavings >= 0 ? '+' : ''}Rs. ${data.netSavings.toLocaleString('en-IN')}`, 48 + (kpiWidth + kpiGap) * 2, kpiY + 24);

      // Card 4: Total Txs
      doc.rect(40 + (kpiWidth + kpiGap) * 3, kpiY, kpiWidth, 55).fillAndStroke('#F5F3FF', '#DDD6FE');
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
         .text('RECORDED TXS', 48 + (kpiWidth + kpiGap) * 3, kpiY + 8);
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
         .text(`${data.transactions.length}`, 48 + (kpiWidth + kpiGap) * 3, kpiY + 24);

      // ─── Executive Message from Xpense ───────────────────────────────────────
      const msgY = 248;
      doc.rect(40, msgY, 515, 48).fillAndStroke('#FDF4FF', '#F5D0FE');
      doc.fillColor('#86198F').fontSize(9).font('Helvetica-Bold')
         .text('A MESSAGE FROM THE XPENSE TEAM:', 52, msgY + 8);
      doc.fillColor('#701A75').fontSize(8.5).font('Helvetica')
         .text(
           `"Thank you for choosing Xpense to manage your wealth! Here is your official August 2026 financial summary. Regularly tracking expenditures unlocks long-term financial freedom. Keep up the great consistency!"`,
           52,
           msgY + 20,
           { width: 495, lineGap: 2 }
         );

      // ─── Transactions Breakdown Table ────────────────────────────────────────
      let tableY = 310;
      doc.fillColor(textLight).fontSize(11).font('Helvetica-Bold')
         .text(`August 2026 Transaction History (${data.transactions.length} items)`, 40, tableY);

      tableY += 18;

      // Table Header Row
      doc.rect(40, tableY, 515, 20).fill('#EDE9FE');
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold');
      doc.text('DATE', 48, tableY + 6);
      doc.text('CATEGORY', 110, tableY + 6);
      doc.text('NOTE / DESCRIPTION', 210, tableY + 6);
      doc.text('METHOD', 360, tableY + 6);
      doc.text('TYPE', 430, tableY + 6);
      doc.text('AMOUNT', 480, tableY + 6, { align: 'right', width: 65 });

      tableY += 20;

      if (data.transactions.length === 0) {
        doc.rect(40, tableY, 515, 30).fill('#FAFAFA');
        doc.fillColor(textMuted).fontSize(9).font('Helvetica')
           .text('No transactions were recorded for this period.', 48, tableY + 10, { align: 'center', width: 495 });
        tableY += 30;
      } else {
        // Render up to 35 rows per statement
        const listToRender = data.transactions.slice(0, 35);
        listToRender.forEach((tx, idx) => {
          // Check for page overflow
          if (tableY > 750) {
            doc.addPage();
            tableY = 40;
            // Redraw small header on new page
            doc.rect(40, tableY, 515, 18).fill('#EDE9FE');
            doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold');
            doc.text('DATE', 48, tableY + 5);
            doc.text('CATEGORY', 110, tableY + 5);
            doc.text('NOTE / DESCRIPTION', 210, tableY + 5);
            doc.text('METHOD', 360, tableY + 5);
            doc.text('TYPE', 430, tableY + 5);
            doc.text('AMOUNT', 480, tableY + 5, { align: 'right', width: 65 });
            tableY += 18;
          }

          const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
          doc.rect(40, tableY, 515, 18).fill(rowBg);

          const dateStr = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isExp = tx.type === 'expense';
          const amtColor = isExp ? dangerColor : successColor;
          const methodStr = (tx.paymentMethod || 'cash').toUpperCase();
          const noteStr = (tx.note || '—').slice(0, 28);

          doc.fillColor(textLight).fontSize(7.5).font('Helvetica')
             .text(dateStr, 48, tableY + 5);

          doc.font('Helvetica-Bold')
             .text(tx.categoryName.slice(0, 18), 110, tableY + 5);

          doc.font('Helvetica')
             .text(noteStr, 210, tableY + 5);

          doc.fillColor(textMuted).fontSize(7).font('Helvetica')
             .text(methodStr, 360, tableY + 5);

          doc.fillColor(isExp ? '#B91C1C' : '#047857').font('Helvetica-Bold')
             .text(isExp ? 'EXPENSE' : 'INCOME', 430, tableY + 5);

          doc.fillColor(amtColor).fontSize(8).font('Helvetica-Bold')
             .text(
               `${isExp ? '-' : '+'}Rs. ${tx.amount.toLocaleString('en-IN')}`,
               480,
               tableY + 5,
               { align: 'right', width: 65 }
             );

          tableY += 18;
        });
      }

      // ─── Footer ──────────────────────────────────────────────────────────────
      const footerY = Math.max(tableY + 20, 770);
      if (footerY < 800) {
        doc.rect(40, footerY, 515, 1).fill('#E5E7EB');
        doc.fillColor(textMuted).fontSize(8).font('Helvetica')
           .text('Xpense Inc. • Confidential Financial Report • Automatically generated by Xpense Cloud', 40, footerY + 8, { align: 'center', width: 515 });
        doc.fillColor('#9CA3AF').fontSize(7)
           .text('For questions or support, reach out to sv8244387@gmail.com', 40, footerY + 20, { align: 'center', width: 515 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
