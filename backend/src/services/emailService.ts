import { BrevoClient } from '@getbrevo/brevo';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { config } from '../config/env';

// ─── Brevo Client (lazy-initialized) ─────────────────────────────────────────
let brevoClient: BrevoClient | null = null;

function getBrevoClient(): BrevoClient | null {
  const apiKey = (config.email.brevoApiKey || '').trim();
  if (!apiKey || apiKey.includes('your_brevo_api_key')) return null;
  if (!brevoClient) {
    brevoClient = new BrevoClient({ apiKey });
  }
  return brevoClient;
}

/**
 * Creates a Gmail SMTP transporter strictly bound to IPv4.
 * This guarantees it works on Render and cloud hosts without IPv6 routing.
 */
function createGmailTransporter() {
  const user = (config.email.user || '').trim();
  const pass = (config.email.pass || '').replace(/\s+/g, '');

  if (!user || !pass) {
    throw new Error('EMAIL_USER or EMAIL_PASS is not configured in backend environment');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    // Force IPv4 lookup to prevent ENETUNREACH on Render/cloud containers
    lookup: (hostname: string, _options: unknown, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
      dns.lookup(hostname, { family: 4 }, (err, address, family) => {
        callback(err, address, family);
      });
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  } as any);
}

/**
 * Masks an email for secure, confidential console logging (e.g., jo***@gmail.com)
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  const visible = user.length > 2 ? `${user.slice(0, 2)}***` : `${user.slice(0, 1)}***`;
  return `${visible}@${domain}`;
}

/**
 * Sends a password reset OTP verification code email.
 * Uses official @getbrevo/brevo Node SDK over HTTPS (Port 443).
 * Falls back to Gmail SMTP (IPv4) if Brevo is unavailable.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  otpCode: string,
): Promise<boolean> {
  // Split OTP into individual digit spans for clean, futuristic presentation
  const otpDigits = otpCode.split('').map((d) => `
    <td align="center" style="padding: 0 4px;">
      <div style="width: 44px; height: 54px; line-height: 54px; text-align: center; background: rgba(168, 85, 247, 0.15); border: 1.5px solid rgba(192, 132, 252, 0.4); border-radius: 12px; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 28px; font-weight: 800; color: #FFFFFF; text-shadow: 0 0 12px rgba(192, 132, 252, 0.6);">${d}</div>
    </td>
  `).join('');

  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xpense Password Reset</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #06060D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #FFFFFF;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #06060D; padding: 40px 16px;">
      <tr>
        <td align="center">
          <!-- Main Container -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #0E0C1A; border-radius: 24px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.25); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);">
            
            <!-- Hero Header with Logo -->
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #2A0E52 0%, #15092A 100%); padding: 40px 24px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                
                <!-- Xpense Official Logo -->
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom: 14px;">
                      <img src="https://raw.githubusercontent.com/Rishabh-verma-2/Xpense/main/assets/Xpense_icon.png" 
                           alt="Xpense Logo" 
                           width="68" 
                           height="68" 
                           style="display: block; border-radius: 18px; border: 2px solid rgba(192, 132, 252, 0.5); box-shadow: 0 10px 30px rgba(147, 51, 234, 0.45);" />
                    </td>
                  </tr>
                </table>

                <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF;">
                  Xpense<span style="color: #A855F7;">.</span>
                </h1>
                
                <div style="display: inline-block; margin-top: 10px; padding: 4px 14px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(192, 132, 252, 0.35); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #D8B4FE;">
                  🛡️ Security Verification
                </div>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 36px 32px 28px;">
                <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #FFFFFF;">
                  Hi ${userName || 'there'}, 👋
                </h2>
                <p style="margin: 0 0 24px; font-size: 14px; line-height: 24px; color: #A1A1AA;">
                  We received a request to reset the password for your <strong style="color: #FFFFFF;">Xpense</strong> account. Enter the 6-digit verification code below to securely set your new password:
                </p>

                <!-- OTP Code Display Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(124, 58, 237, 0.05) 100%); border: 1.5px dashed rgba(168, 85, 247, 0.5); border-radius: 20px; padding: 24px 16px; margin-bottom: 24px; text-align: center;">
                  <tr>
                    <td align="center">
                      <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #C084FC; margin-bottom: 14px;">
                        Your One-Time Password
                      </div>
                      
                      <!-- Digit boxes -->
                      <table border="0" cellpadding="0" cellspacing="0" align="center">
                        <tr>
                          ${otpDigits}
                        </tr>
                      </table>

                      <div style="margin-top: 16px;">
                        <span style="display: inline-block; font-size: 12px; font-weight: 600; color: #F59E0B; background: rgba(245, 158, 11, 0.12); padding: 4px 14px; border-radius: 20px; border: 1px solid rgba(245, 158, 11, 0.3);">
                          ⏳ Valid for 15 minutes
                        </span>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Security Tip Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(255, 255, 255, 0.02); border-left: 3px solid #9333EA; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
                  <tr>
                    <td style="font-size: 12px; line-height: 20px; color: #71717A;">
                      🔒 <strong style="color: #D4D4D8;">Didn't request this?</strong> If you didn't initiate a password reset, you can safely ignore this email. No changes will be made to your account.
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.06); margin: 24px 0;" />

                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #52525B;">
                  Need help? Contact support or reply directly to this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 24px 28px; background: #07060D; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #71717A;">
                  Xpense • Smart Financial Tracking & Milestones
                </p>
                <p style="margin: 0; font-size: 11px; color: #3F3F46;">
                  © ${new Date().getFullYear()} Xpense. All rights reserved. • Built with Privacy First
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // 1. Primary: Brevo Node SDK (@getbrevo/brevo) over HTTPS Port 443
  const brevo = getBrevoClient();
  if (brevo) {
    try {
      const senderEmail = (config.email.brevoSenderEmail || config.email.user || '').trim();
      const response = await brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: 'Xpense Security',
          email: senderEmail,
        },
        to: [
          {
            email: toEmail,
            name: userName || 'User',
          },
        ],
        subject: '🔒 Your Xpense Password Reset Code',
        htmlContent: htmlTemplate,
      });

      console.log(`✉️ Password reset email delivered via Brevo SDK to ${maskEmail(toEmail)} (msgId: ${response?.messageId})`);
      return true;
    } catch (err: any) {
      console.warn(`⚠️ Brevo SDK delivery failed for ${maskEmail(toEmail)}: ${err.message}. Trying Gmail fallback...`);
    }
  }

  // 2. Fallback: Gmail SMTP (IPv4)
  try {
    const transporter = createGmailTransporter();
    const info = await transporter.sendMail({
      from: `"Xpense Security" <${config.email.user || 'support@xpense.app'}>`,
      to: toEmail,
      subject: '🔒 Your Xpense Password Reset Code',
      html: htmlTemplate,
    });
    console.log(`✉️ Password reset email delivered via Gmail SMTP (IPv4) to ${maskEmail(toEmail)} (msgId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error(`❌ All email delivery options failed for ${maskEmail(toEmail)}:`, err.message || err);
    throw new Error(err.message || 'Failed to send password reset email');
  }
}
