import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Budget, Transaction } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/budgets?month=8&year=2026 ───────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year  as string) || new Date().getFullYear();

    const budgets = await Budget.find({ userId: req.userId, month, year })
      .populate('categoryId', 'name icon color type')
      .lean();

    // Enrich each budget with actual spending from transactions
    const dateGte = new Date(year, month - 1, 1);
    const dateLt  = new Date(year, month, 1);

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const result = await Transaction.aggregate([
          {
            $match: {
              userId:     new Types.ObjectId(req.userId),
              categoryId: b.categoryId as unknown as Types.ObjectId,
              type:       'expense',
              date:       { $gte: dateGte, $lt: dateLt },
            },
          },
          { $group: { _id: null, spent: { $sum: '$amount' } } },
        ]);
        return { ...b, spent: result[0]?.spent ?? 0 };
      })
    );

    return res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[GET /budgets]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch budgets' });
  }
});

// ─── POST /api/budgets ────────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, limit, period, month, year } = req.body;
    if (!categoryId || limit === undefined) {
      return res.status(400).json({ success: false, message: 'categoryId and limit are required' });
    }

    const m = month ?? new Date().getMonth() + 1;
    const y = year  ?? new Date().getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, categoryId, month: m, year: y },
      { limit: parseFloat(limit), period: period ?? 'monthly' },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).populate('categoryId', 'name icon color type');

    return res.status(201).json({ success: true, data: budget });
  } catch (err) {
    console.error('[POST /budgets]', err);
    return res.status(500).json({ success: false, message: 'Failed to set budget' });
  }
});

// ─── DELETE /api/budgets/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const param = req.params.id;
    let budget = null;

    if (Types.ObjectId.isValid(param)) {
      budget = await Budget.findOneAndDelete({ _id: param, userId: req.userId });
    }
    if (!budget) {
      budget = await Budget.findOneAndDelete({ categoryId: param, userId: req.userId });
    }

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    return res.json({ success: true, message: 'Budget deleted' });
  } catch (err) {
    console.error('[DELETE /budgets/:id]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete budget' });
  }
});

export default router;
