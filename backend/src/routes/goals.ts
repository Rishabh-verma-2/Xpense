import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Goal } from '../models/Goal';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/goals ───────────────────────────────────────────────────────────
// Returns the active goal for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const goal = await Goal.findOne({ userId: new Types.ObjectId(req.userId) }).sort({ updatedAt: -1 });
    return res.json({ success: true, data: goal || null });
  } catch (err: any) {
    console.error('[GET /api/goals]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch goal' });
  }
});

// ─── POST /api/goals ──────────────────────────────────────────────────────────
// Creates or updates (upserts) a goal for the user
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, targetAmount, savedAmount = 0, deadline, emoji = '🎯', icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Goal name is required' });
    }

    const target = Number(targetAmount);
    if (isNaN(target) || target <= 0) {
      return res.status(400).json({ success: false, message: 'Valid target amount is required' });
    }

    const saved = Number(savedAmount) || 0;
    const isCompleted = saved >= target;

    let goal = await Goal.findOne({ userId: new Types.ObjectId(req.userId) });

    if (goal) {
      goal.name = name.trim();
      goal.targetAmount = target;
      goal.savedAmount = Math.max(0, saved);
      goal.deadline = deadline ? new Date(deadline) : goal.deadline;
      goal.emoji = emoji || goal.emoji;
      if (icon) goal.icon = icon;
      if (color) goal.color = color;
      goal.isCompleted = isCompleted;
      await goal.save();
    } else {
      goal = await Goal.create({
        userId: new Types.ObjectId(req.userId),
        name: name.trim(),
        targetAmount: target,
        savedAmount: Math.max(0, saved),
        deadline: deadline ? new Date(deadline) : null,
        emoji: emoji || '🎯',
        icon: icon || 'trophy-outline',
        color: color || '#10B981',
        isCompleted,
      });
    }

    return res.status(201).json({ success: true, data: goal });
  } catch (err: any) {
    console.error('[POST /api/goals]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to save goal' });
  }
});

// ─── PATCH /api/goals/progress ───────────────────────────────────────────────
// Fast update for current saved amount
router.patch('/progress', async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const saved = Number(amount);

    if (isNaN(saved) || saved < 0) {
      return res.status(400).json({ success: false, message: 'Valid saved amount is required' });
    }

    const goal = await Goal.findOne({ userId: new Types.ObjectId(req.userId) });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'No goal found to update' });
    }

    goal.savedAmount = saved;
    goal.isCompleted = saved >= goal.targetAmount;
    await goal.save();

    return res.json({ success: true, data: goal });
  } catch (err: any) {
    console.error('[PATCH /api/goals/progress]', err);
    return res.status(500).json({ success: false, message: 'Failed to update goal progress' });
  }
});

// ─── DELETE /api/goals ────────────────────────────────────────────────────────
// Removes the user's savings goal
router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    await Goal.deleteMany({ userId: new Types.ObjectId(req.userId) });
    return res.json({ success: true, message: 'Goal successfully removed' });
  } catch (err: any) {
    console.error('[DELETE /api/goals]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete goal' });
  }
});

export default router;
