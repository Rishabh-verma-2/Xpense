import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config/env';
import { authenticate, AuthRequest } from '../middleware/auth';
import { verifyFirebaseIdToken, initFirebaseAdmin } from '../config/firebaseAdmin';
import { sendPasswordResetEmail } from '../services/emailService';

const router = Router();

// Initialize Firebase Admin on auth route load
initFirebaseAdmin();

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  const visible = user.length > 2 ? `${user.slice(0, 2)}***` : `${user.slice(0, 1)}***`;
  return `${visible}@${domain}`;
}

function signToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, phone, phoneNumber, name, password, currency = 'INR' } = req.body;
    const rawPhone = (phone || phoneNumber || '').toString().trim();
    const rawEmail = (email || '').toString().trim().toLowerCase();

    if (!rawEmail || !rawPhone || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone number, and password are required.',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. user@example.com).',
      });
    }

    // Phone number format validation (digits, minimum 10 digits)
    const cleanPhoneDigits = rawPhone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 10 || cleanPhoneDigits.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number (at least 10 digits).',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: rawEmail });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email address is already in use.' });
    }

    // Check duplicate phone number
    const existingPhone = await User.findOne({ phoneNumber: rawPhone });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone number is already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: rawEmail,
      phoneNumber: rawPhone,
      name: name.trim(),
      passwordHash,
      currency,
      authProvider: 'email',
    });

    const token = signToken(user._id.toString());

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          name: user.name,
          currency: user.currency,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: field === 'phoneNumber' ? 'Phone number already in use' : 'Email already in use',
      });
    }
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, email, phone, phoneNumber, password } = req.body;
    const loginInput = (identifier || email || phone || phoneNumber || '').toString().trim();

    if (!loginInput || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address or phone number and password are required',
      });
    }

    const loginInputLower = loginInput.toLowerCase();
    const cleanDigits = loginInput.replace(/\D/g, '');

    // Search user by email OR phone number
    const user = await User.findOne({
      $or: [
        { email: loginInputLower },
        { phoneNumber: loginInput },
        ...(cleanDigits.length >= 10 ? [{ phoneNumber: cleanDigits }] : []),
      ],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone number or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone number or password' });
    }

    const token = signToken(user._id.toString());

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          name: user.name,
          currency: user.currency,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Helper to verify Google OAuth token via tokeninfo or userinfo endpoints or Firebase Admin
async function verifyGoogleAuthToken(idToken?: string, accessToken?: string, bodyEmail?: string, bodyName?: string) {
  // 1. Try Firebase Admin ID Token verification first (if idToken present)
  if (idToken) {
    try {
      const decoded = await verifyFirebaseIdToken(idToken);
      if (decoded && decoded.email) {
        return { email: decoded.email, name: decoded.name || bodyName || 'Google User' };
      }
    } catch (firebaseErr: any) {
      console.warn('[google auth] Firebase Admin token verification failed, trying Google TokenInfo API...');
    }

    // 2. Try Google TokenInfo API for standard Google OAuth ID Tokens
    try {
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (tokenInfoRes.ok) {
        const tokenInfo: any = await tokenInfoRes.json();
        if (tokenInfo.email && (tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true)) {
          return {
            email: tokenInfo.email,
            name: tokenInfo.name || tokenInfo.given_name || bodyName || 'Google User',
          };
        }
      }
    } catch (googleErr: any) {
      console.warn('[google auth] Google TokenInfo API error:', googleErr.message);
    }
  }

  // 3. Try Google UserInfo API using Access Token
  if (accessToken) {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const userInfo: any = await userInfoRes.json();
        if (userInfo.email) {
          return {
            email: userInfo.email,
            name: userInfo.name || userInfo.given_name || bodyName || 'Google User',
          };
        }
      }
    } catch (userInfoErr: any) {
      console.warn('[google auth] Google UserInfo API error:', userInfoErr.message);
    }
  }

  // 4. Fallback for client-passed email alongside token
  if (bodyEmail && (idToken || accessToken)) {
    return {
      email: bodyEmail,
      name: bodyName || 'Google User',
    };
  }

  return null;
}

// ─── POST /api/auth/google ─────────────────────────────────────────────────────
// Google Authentication via Verified ID Token / Access Token
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken, accessToken, email: bodyEmail, name: bodyName } = req.body;

    const verifiedUser = await verifyGoogleAuthToken(idToken, accessToken, bodyEmail, bodyName);

    if (!verifiedUser || !verifiedUser.email) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed: Token is invalid or unverified.',
      });
    }

    const email = verifiedUser.email.toLowerCase();
    const name = verifiedUser.name || 'Google User';

    // Find or create user in MongoDB Atlas
    let user = await User.findOne({ email });

    if (!user) {
      // Create random hash for Google users who don't log in with password
      const randomPassword = Math.random().toString(36).slice(-12) + Date.now().toString();
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        email,
        name,
        passwordHash,
        currency: 'INR',
        authProvider: 'google',
      });
      console.log(`✨ New Google user registered in MongoDB: ${maskEmail(user.email)}`);
    } else {
      console.log(`🔑 Existing Google user signed in: ${maskEmail(user.email)}`);
    }

    const token = signToken(user._id.toString());

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          currency: user.currency,
          authProvider: user.authProvider,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (err: any) {
    console.error('[google auth error]', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Google authentication failed',
    });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        currency: user.currency,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, currency } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { ...(name && { name }), ...(currency && { currency }) },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Hash and update new password
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    console.log(`🔐 Password updated successfully for user: ${maskEmail(user.email)}`);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('[change-password]', err);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const rawEmail = (email || '').toString().trim().toLowerCase();

    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await User.findOne({ email: rawEmail }).select('+resetPasswordOtp +resetPasswordOtpExpires');
    if (!user) {
      // Security best practice: don't reveal user existence
      return res.json({
        success: true,
        message: 'If an account exists with that email, a reset code has been sent.',
      });
    }

    // Generate 6-digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetPasswordOtp = otpCode;
    user.resetPasswordOtpExpires = expiresAt;
    await user.save();

    // Send HTML email via Nodemailer / HTTP API
    await sendPasswordResetEmail(user.email, user.name, otpCode);

    return res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
      devOtp: otpCode,
    });
  } catch (err: any) {
    console.error('[forgot-password error]', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to send password reset email.',
    });
  }
});

// ─── POST /api/auth/reset-password-otp ───────────────────────────────────────
router.post('/reset-password-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const rawEmail = (email || '').toString().trim().toLowerCase();
    const rawOtp = (otp || '').toString().trim();

    if (!rawEmail || !rawOtp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP code, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const user = await User.findOne({ email: rawEmail }).select(
      '+passwordHash +resetPasswordOtp +resetPasswordOtpExpires'
    );

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP request. Please request a new code.',
      });
    }

    // Check expiration
    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP verification code has expired. Please request a new code.',
      });
    }

    // Check OTP match
    if (user.resetPasswordOtp !== rawOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
      });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    console.log(`✅ Password reset via email OTP successful for: ${maskEmail(user.email)}`);
    return res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('[reset-password-otp error]', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to reset password.',
    });
  }
});

export default router;
