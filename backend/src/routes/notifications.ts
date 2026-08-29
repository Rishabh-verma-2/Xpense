import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Notification } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/notifications ───────────────────────────────────────────────────
// Returns personal notifications + global broadcasts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const filter = {
      $or: [
        { userId: new Types.ObjectId(req.userId) },
        { userId: null },
      ],
    };

    const list = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('[GET /api/notifications]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ─── POST /api/notifications/broadcast ────────────────────────────────────────
// Push an announcement to all users (userId = null)
router.post('/broadcast', async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, type, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'title and body are required' });
    }

    const broadcastNotif = await Notification.create({
      userId: null, // Broadcast to all users
      title,
      body,
      type: type || 'system',
      data: data || {},
    });

    console.log(`📢 [Broadcast Notification Created]: "${title}"`);
    return res.status(201).json({ success: true, data: broadcastNotif });
  } catch (err) {
    console.error('[POST /api/notifications/broadcast]', err);
    return res.status(500).json({ success: false, message: 'Failed to broadcast notification' });
  }
});

export default router;
