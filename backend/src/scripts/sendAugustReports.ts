/**
 * Standalone batch dispatch script to send all registered users in MongoDB Atlas:
 * 1. "A Message from Xpense" letter
 * 2. An attached luxury PDF statement of their August 2026 spending and cashflow.
 */
import mongoose from 'mongoose';
import { config } from '../config/env';
import '../models/Category';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { generateMonthlySpendingPDF } from '../services/pdfGenerator';
import { sendAugustSpendingReportEmail } from '../services/emailService';

async function run() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  await mongoose.connect(config.mongo.uri, { dbName: config.mongo.dbName });
  console.log('✅ Connected to MongoDB Atlas:', config.mongo.dbName);

  const users = await User.find({});
  console.log(`📋 Found ${users.length} registered user(s) to process.\n`);

  const augustStart = new Date('2026-08-01T00:00:00.000Z');
  const augustEnd   = new Date('2026-08-31T23:59:59.999Z');

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    const email = user.email?.trim();
    if (!email) {
      console.warn(`⏩ Skipping user ${user.name || user._id}: No email address.`);
      continue;
    }

    console.log(`------------------------------------------------------------`);
    console.log(`👤 Processing user: ${user.name} <${email}>`);

    try {
      // 1. Fetch user transactions for August 2026
      const txs = await Transaction.find({
        userId: user._id,
        date: { $gte: augustStart, $lte: augustEnd },
      })
        .populate('categoryId')
        .sort({ date: -1 });

      let totalIncome = 0;
      let totalExpense = 0;

      const formattedTxs = txs.map((t: any) => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') totalIncome += amt;
        else totalExpense += amt;

        const cat = t.categoryId;
        const catName = typeof cat === 'object' && cat?.name ? cat.name : 'General';

        return {
          date: t.date,
          categoryName: catName,
          note: t.note || '',
          paymentMethod: t.paymentMethod || 'cash',
          type: t.type as 'income' | 'expense',
          amount: amt,
        };
      });

      const netSavings = totalIncome - totalExpense;

      console.log(`   📊 August Stats: Inflow: ₹${totalIncome} | Outflow: ₹${totalExpense} | Net: ₹${netSavings} | Txs: ${formattedTxs.length}`);

      // 2. Generate PDF Document
      console.log(`   📄 Generating PDF Financial Statement...`);
      const pdfBuffer = await generateMonthlySpendingPDF({
        userName: user.name || 'Valued User',
        userEmail: email,
        monthName: 'August 2026',
        totalIncome,
        totalExpense,
        netSavings,
        transactions: formattedTxs,
      });

      console.log(`   ✅ PDF generated successfully (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

      // 3. Send Email via Brevo with PDF attachment
      console.log(`   ✉️ Dispatching email via Brevo...`);
      await sendAugustSpendingReportEmail({
        toEmail: email,
        userName: user.name || 'Valued User',
        totalIncome,
        totalExpense,
        netSavings,
        transactionCount: formattedTxs.length,
        pdfBuffer,
      });

      console.log(`   🎉 Successfully sent report to ${email}`);
      successCount++;
    } catch (err: any) {
      console.error(`   ❌ Failed to send report to ${email}:`, err.message || err);
      failCount++;
    }

    // Gentle delay to respect API rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n============================================================`);
  console.log(`📊 BATCH DISPATCH SUMMARY:`);
  console.log(`   ✅ Success: ${successCount} user(s)`);
  console.log(`   ❌ Failed : ${failCount} user(s)`);
  console.log(`============================================================\n`);

  await mongoose.disconnect();
  process.exit(failCount > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal batch dispatch error:', err);
  process.exit(1);
});
