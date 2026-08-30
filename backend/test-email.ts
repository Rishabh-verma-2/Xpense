import dotenv from 'dotenv';
dotenv.config();

import { sendPasswordResetEmail } from './src/services/emailService';

// Sending to an external email address (not sv8244387@gmail.com)
const TARGET_EMAIL = process.argv[2] || 'rishabh.verma2626@gmail.com';
const TEST_NAME    = 'Rishabh';
const TEST_OTP     = '938102';

(async () => {
  console.log(`🚀 Sending test email to: ${TARGET_EMAIL}`);
  console.log(`   Resend API Key: ${process.env.RESEND_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`   Gmail User    : ${process.env.EMAIL_USER ? 'Present' : 'Missing'}`);
  console.log('');

  try {
    const success = await sendPasswordResetEmail(TARGET_EMAIL, TEST_NAME, TEST_OTP);
    if (success) {
      console.log(`\n🎉 SUCCESS! Email delivered to ${TARGET_EMAIL}`);
    }
  } catch (err: any) {
    console.error(`\n❌ Error:`, err.message);
  }
})();
