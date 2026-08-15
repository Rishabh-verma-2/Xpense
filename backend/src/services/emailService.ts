import nodemailer from 'nodemailer';
import { config } from '../config/env';

/**
 * Creates and returns a Nodemailer Transporter configured with SMTP credentials.
 * Uses dedicated SSL on port 465 for robust delivery on cloud hosting (Render/AWS/Vercel).
 */
function createTransporter() {
  if (!config.email.user || !config.email.pass) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS is not configured in backend/.env');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });
}

/**
 * Sends a password reset OTP verification code email using Nodemailer.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  otpCode: string,
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xpense Password Reset</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #06060D;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #FFFFFF;
        }
        .wrapper {
          width: 100%;
          background-color: #06060D;
          padding: 36px 16px;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: #110E1C;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(168, 85, 247, 0.25);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        }
        .header {
          background: linear-gradient(135deg, #2E1065 0%, #170A38 100%);
          padding: 36px 24px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .logo-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(168, 85, 247, 0.15);
          border: 1.5px solid rgba(192, 132, 252, 0.4);
          margin-bottom: 12px;
          font-size: 24px;
        }
        .logo-title {
          font-size: 26px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .logo-title span {
          color: #C084FC;
        }
        .body-content {
          padding: 32px 28px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 12px;
        }
        .text {
          font-size: 14px;
          line-height: 24px;
          color: #A1A1AA;
          margin-bottom: 24px;
        }
        .otp-card {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(124, 58, 237, 0.06) 100%);
          border: 1.5px dashed rgba(168, 85, 247, 0.6);
          border-radius: 16px;
          padding: 24px 20px;
          text-align: center;
          margin: 24px 0;
        }
        .otp-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #D8B4FE;
          margin-bottom: 8px;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 40px;
          font-weight: 800;
          letter-spacing: 12px;
          color: #E9D5FF;
          text-shadow: 0 0 16px rgba(192, 132, 252, 0.5);
          padding-left: 12px;
        }
        .expiry-tag {
          display: inline-block;
          font-size: 12px;
          color: #F59E0B;
          margin-top: 12px;
          font-weight: 600;
          background: rgba(245, 158, 11, 0.12);
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .security-notice {
          font-size: 12px;
          line-height: 18px;
          color: #71717A;
          background: rgba(255, 255, 255, 0.02);
          padding: 12px 16px;
          border-radius: 10px;
          border-left: 3px solid #7C3AED;
        }
        .footer {
          padding: 20px 28px;
          background: #090812;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          font-size: 11px;
          color: #52525B;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo-box">💎</div>
            <h1 class="logo-title">Xpense<span>.</span></h1>
          </div>
          <div class="body-content">
            <div class="greeting">Hi ${userName || 'there'},</div>
            <div class="text">
              We received a request to reset the password for your Xpense account. Enter the 6-digit verification code below to complete your password reset:
            </div>
            
            <div class="otp-card">
              <div class="otp-label">Verification Code</div>
              <div class="otp-code">${otpCode}</div>
              <div>
                <span class="expiry-tag">⏳ Valid for 15 minutes</span>
              </div>
            </div>

            <div class="security-notice">
              🔒 <strong>Security reminder:</strong> If you did not request this password reset, please ignore this email. Your account credentials remain completely safe.
            </div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Xpense Financial Tracker • Built with Privacy First
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"Xpense Security" <${config.email.user}>`,
      to: toEmail,
      subject: '🔒 Your Xpense Password Reset Code',
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Password reset OTP email successfully sent to ${toEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to send email via Nodemailer:', err.message || err);
    throw new Error(err.message || 'Failed to send password reset email');
  }
}
