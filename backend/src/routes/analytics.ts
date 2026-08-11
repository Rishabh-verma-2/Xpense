import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Transaction, Category } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/analytics/monthly?year=2026 ─────────────────────────────────────
router.get('/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const uid  = new Types.ObjectId(req.userId);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: uid,
          date: {
            $gte: new Date(year, 0, 1),
            $lt:  new Date(year + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id:   { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Build 12-month shape
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const inc = result.find((r) => r._id.month === m && r._id.type === 'income');
      const exp = result.find((r) => r._id.month === m && r._id.type === 'expense');
      return { month: m, income: inc?.total ?? 0, expense: exp?.total ?? 0 };
    });

    return res.json({ success: true, data: months });
  } catch (err) {
    console.error('[GET /analytics/monthly]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch monthly analytics' });
  }
});

// ─── GET /api/analytics/category?month=8&year=2026 ────────────────────────────
router.get('/category', async (req: AuthRequest, res: Response) => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year  as string) || new Date().getFullYear();
    const uid   = new Types.ObjectId(req.userId);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: uid,
          type:   'expense',
          date: {
            $gte: new Date(year, month - 1, 1),
            $lt:  new Date(year, month, 1),
          },
        },
      },
      {
        $group: {
          _id:   '$categoryId',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
      {
        $lookup: {
          from:         'categories',
          localField:   '_id',
          foreignField: '_id',
          as:           'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id:      0,
          total:    1,
          category: { name: 1, icon: 1, color: 1 },
        },
      },
    ]);

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[GET /analytics/category]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch category analytics' });
  }
});

export default router;
