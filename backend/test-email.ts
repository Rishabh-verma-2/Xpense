import dotenv from 'dotenv';
dotenv.config();

import { sendPasswordResetEmail } from './src/services/emailService';

const TARGET_EMAIL = process.argv[2] || 'rishabh.verma2626@gmail.com';
const TEST_NAME    = 'Rishabh';
const TEST_OTP     = '724185';

(async () => {
  console.log(`🚀 Sending test email via @getbrevo/brevo SDK to: ${TARGET_EMAIL}`);
  console.log(`   BREVO_API_KEY      : ${process.env.BREVO_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`   BREVO_SENDER_EMAIL : ${process.env.BREVO_SENDER_EMAIL || 'Missing'}`);
  console.log('');

  try {
    const success = await sendPasswordResetEmail(TARGET_EMAIL, TEST_NAME, TEST_OTP);
    if (success) {
      console.log(`\n🎉 SUCCESS! Email delivered to ${TARGET_EMAIL} via Brevo SDK`);
    }
  } catch (err: any) {
    console.error(`\n❌ Error:`, err.message);
  }
})();
