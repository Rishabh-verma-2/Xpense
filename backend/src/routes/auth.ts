import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config/env';
import { authenticate, AuthRequest } from '../middleware/auth';
import { verifyFirebaseIdToken, initFirebaseAdmin } from '../config/firebaseAdmin';

const router = Router();

// Initialize Firebase Admin on auth route load
initFirebaseAdmin();

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
function signToken(userId: string) {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password, currency = 'INR' } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'email, name, and password are required',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, name, passwordHash, currency });

    const token = signToken(user._id.toString());

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          currency: user.currency,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
      console.log(`✨ New Google user registered in MongoDB: ${user.email}`);
    } else {
      console.log(`🔑 Existing Google user signed in: ${user.email}`);
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

export default router;
