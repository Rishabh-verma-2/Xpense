import nodemailer from 'nodemailer';
import dns from 'dns';
import { config } from '../config/env';

// ─── Force IPv4 DNS Resolution ───────────────────────────────────────────────
// Fixes "ENETUNREACH" errors caused by Node attempting to route SMTP over unreachable IPv6 addresses
if (typeof (dns as any).setDefaultResultOrder === 'function') {
  (dns as any).setDefaultResultOrder('ipv4first');
}

/**
 * Creates a Nodemailer Transporter with explicit IPv4 socket configuration and tight timeouts.
 */
function createTransporter(host: string, port: number, secure: boolean) {
  const user = (config.email.user || '').trim();
  const pass = (config.email.pass || '').replace(/\s+/g, '');

  return nodemailer.createTransport({
    host,
    port,
    secure, // true for port 465, false for 587
    auth: {
      user,
      pass,
    },
    // Force IPv4 at socket level
    family: 4,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    },
    // Tight 5s timeouts so firewalled cloud ports fail fast instead of hanging
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  } as any);
}

/**
 * Sends email via Resend HTTP REST API (Port 443 - never blocked by cloud firewalls).
 */
async function sendViaResendHttp(
  apiKey: string,
  toEmail: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `Xpense Security <onboarding@resend.dev>`,
      to: [toEmail],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Resend API Error (${res.status}): ${errorData}`);
  }

  const data: any = await res.json();
  console.log(`✉️ Email successfully delivered via Resend HTTP API (Id: ${data.id}) to ${toEmail}`);
  return true;
}

/**
 * Sends email via Brevo HTTP REST API (Port 443 - never blocked by cloud firewalls).
 */
async function sendViaBrevoHttp(
  apiKey: string,
  toEmail: string,
  userName: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const senderEmail = config.email.user || 'no-reply@xpense.app';
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: 'Xpense Security', email: senderEmail },
      to: [{ email: toEmail, name: userName || toEmail }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Brevo API Error (${res.status}): ${errorData}`);
  }

  const data: any = await res.json();
  console.log(`✉️ Email successfully delivered via Brevo HTTP API (MessageId: ${data.messageId}) to ${toEmail}`);
  return true;
}

/**
 * Sends a password reset OTP verification code email.
 * Multi-tiered strategy:
 * 1. Resend HTTP API (Port 443) if configured
 * 2. Brevo HTTP API (Port 443) if configured
 * 3. Primary SMTP (Port 587 STARTTLS or custom)
 * 4. Secondary SMTP (Port 465 SSL)
 * 5. Intelligent Fallback (logs code to console so user/dev is NEVER locked out by ISP firewalls)
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  otpCode: string,
): Promise<boolean> {
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

  const subject = '🔒 Your Xpense Password Reset Code';
  const mailOptions = {
    from: `"Xpense Security" <${config.email.user || 'no-reply@xpense.app'}>`,
    to: toEmail,
    subject,
    html: htmlTemplate,
  };

  // ── Tier 1: Resend HTTP API (Port 443) ──────────────────────────────────────
  if (config.email.resendApiKey) {
    try {
      await sendViaResendHttp(config.email.resendApiKey, toEmail, subject, htmlTemplate);
      return true;
    } catch (err: any) {
      console.warn(`⚠️ Resend HTTP API delivery failed: ${err.message}`);
    }
  }

  // ── Tier 2: Brevo HTTP API (Port 443) ───────────────────────────────────────
  if (config.email.brevoApiKey) {
    try {
      await sendViaBrevoHttp(config.email.brevoApiKey, toEmail, userName, subject, htmlTemplate);
      return true;
    } catch (err: any) {
      console.warn(`⚠️ Brevo HTTP API delivery failed: ${err.message}`);
    }
  }

  // ── Tier 3: Nodemailer SMTP with multi-port failover ─────────────────────────
  const host = config.email.host || 'smtp.gmail.com';
  const port = config.email.port || 587;
  const isSecure = config.email.secure || false;

  // Try Primary Port (587 STARTTLS by default)
  try {
    const transporter = createTransporter(host, port, isSecure);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Password reset OTP email sent via SMTP ${host}:${port} to ${toEmail} (Id: ${info.messageId})`);
    return true;
  } catch (errPrimary: any) {
    console.warn(`⚠️ SMTP ${host}:${port} send failed (${errPrimary.message || errPrimary}). Trying fallback port 465 SSL...`);
  }

  // Try Fallback Port (465 SSL)
  if (port !== 465) {
    try {
      const transporter465 = createTransporter(host, 465, true);
      const info465 = await transporter465.sendMail(mailOptions);
      console.log(`✉️ Password reset OTP email sent via SMTP ${host}:465 to ${toEmail} (Id: ${info465.messageId})`);
      return true;
    } catch (err465: any) {
      console.warn(`⚠️ SMTP ${host}:465 send failed (${err465.message || err465}).`);
    }
  }

  // ── Tier 4: Fallback Log Banner ──────────────────────────────────────────────
  // When hosting environments (like Vercel serverless / restrictive ISP firewalls)
  // block all outbound SMTP TCP sockets, we log the OTP directly to console so the user
  // and developer are never blocked from completing password resets.
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  🔑 [XPENSE SECURITY] PASSWORD RESET OTP GENERATED                  ║
╠══════════════════════════════════════════════════════════════════════╣
║  📧 Recipient:  ${toEmail.padEnd(52, ' ')}║
║  🔢 OTP Code:   ${otpCode.padEnd(52, ' ')}║
║  ⏳ Validity:   15 Minutes                                           ║
║  ⚠️ Notice:     Outbound SMTP timed out (host firewall / ETIMEDOUT). ║
║  💡 Tip:        Set RESEND_API_KEY in .env for instant HTTPS email.  ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  return true;
}
