import nodemailer from 'nodemailer';
import { config } from '../config/env';

/**
 * Creates and returns a Nodemailer Transporter configured with SMTP credentials.
 */
function createTransporter() {
  if (!config.email.user || !config.email.pass) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS is not configured in backend/.env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
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
          background-color: #0F0E17;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #FFFFFE;
        }
        .wrapper {
          width: 100%;
          background-color: #0F0E17;
          padding: 30px 15px;
        }
        .container {
          max-width: 520px;
          margin: 0 auto;
          background: #181528;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(124, 58, 237, 0.25);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #2D1B69 0%, #1A0A4A 100%);
          padding: 32px 24px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.5px;
        }
        .logo span {
          color: #C084FC;
        }
        .body-content {
          padding: 32px 24px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFE;
          margin-bottom: 12px;
        }
        .text {
          font-size: 14px;
          line-height: 22px;
          color: #A7A6BA;
          margin-bottom: 24px;
        }
        .otp-box {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(88, 28, 135, 0.1) 100%);
          border: 1.5px dashed #7C3AED;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 38px;
          font-weight: 800;
          letter-spacing: 10px;
          color: #C084FC;
          text-shadow: 0 0 12px rgba(192, 132, 252, 0.4);
        }
        .expiry-text {
          font-size: 12px;
          color: #F59E0B;
          margin-top: 10px;
          font-weight: 600;
        }
        .footer {
          padding: 20px 24px;
          background: #110E1C;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          font-size: 12px;
          color: #6E6D82;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">Xpense<span>.</span> 🚀</div>
          </div>
          <div class="body-content">
            <div class="greeting">Hi ${userName},</div>
            <div class="text">
              We received a request to reset your password for your Xpense account. Use the 6-digit verification code below to complete your password reset:
            </div>
            
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
              <div class="expiry-text">⏳ Code expires in 15 minutes</div>
            </div>

            <div class="text" style="font-size: 13px;">
              If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
            </div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Xpense App. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"Xpense Security" <${config.email.user}>`,
      to: toEmail,
      subject: '🔒 Xpense — Password Reset Verification Code',
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Password reset OTP email sent to ${toEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to send email via Nodemailer:', err.message || err);
    throw new Error(err.message || 'Failed to send password reset email');
  }
}
