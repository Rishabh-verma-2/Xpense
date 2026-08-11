import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Transaction, Category } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/transactions ────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, type, categoryId, limit = '50', offset = '0' } = req.query;

    const filter: Record<string, any> = { userId: req.userId };

    if (type) filter.type = type;
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId as string);

    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lt:  new Date(y, m, 1),
      };
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('categoryId', 'name icon color type')
        .sort({ date: -1 })
        .skip(parseInt(offset as string))
        .limit(parseInt(limit as string))
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return res.json({ success: true, data: transactions, meta: { total } });
  } catch (err) {
    console.error('[GET /transactions]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// ─── GET /api/transactions/summary ───────────────────────────────────────────
// NOTE: must be before /:id to avoid "summary" being treated as an id
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const m = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const y = parseInt(req.query.year  as string) || new Date().getFullYear();

    const dateFilter = {
      $gte: new Date(y, m - 1, 1),
      $lt:  new Date(y, m, 1),
    };

    const [incomeResult, expenseResult] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: new Types.ObjectId(req.userId), type: 'income', date: dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { userId: new Types.ObjectId(req.userId), type: 'expense', date: dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalIncome  = incomeResult[0]?.total  ?? 0;
    const totalExpense = expenseResult[0]?.total ?? 0;

    return res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        month: m,
        year: y,
      },
    });
  } catch (err) {
    console.error('[GET /transactions/summary]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});

// ─── POST /api/transactions ───────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, type, amount, note, date, isRecurring } = req.body;

    if (!categoryId || !type || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'categoryId, type, and amount are required',
      });
    }

    const transaction = await Transaction.create({
      userId:      req.userId,
      categoryId,
      type,
      amount:      parseFloat(amount),
      note,
      date:        date ? new Date(date) : new Date(),
      isRecurring: !!isRecurring,
    });

    const populated = await transaction.populate('categoryId', 'name icon color type');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('[POST /transactions]', err);
    return res.status(500).json({ success: false, message: 'Failed to create transaction' });
  }
});

// ─── PUT /api/transactions/:id ────────────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { categoryId, type, amount, note, date, isRecurring } = req.body;
    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        ...(categoryId !== undefined && { categoryId }),
        ...(type       !== undefined && { type }),
        ...(amount     !== undefined && { amount: parseFloat(amount) }),
        ...(note       !== undefined && { note }),
        ...(date       !== undefined && { date: new Date(date) }),
        ...(isRecurring !== undefined && { isRecurring: !!isRecurring }),
      },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name icon color type');

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PUT /transactions/:id]', err);
    return res.status(500).json({ success: false, message: 'Failed to update transaction' });
  }
});

// ─── DELETE /api/transactions/all (Erase all user transactions) ─────────────
router.delete('/all', async (req: AuthRequest, res: Response) => {
  try {
    await Transaction.deleteMany({ userId: new Types.ObjectId(req.userId) });
    return res.json({ success: true, message: 'All user transactions erased successfully' });
  } catch (err) {
    console.error('[DELETE /transactions/all]', err);
    return res.status(500).json({ success: false, message: 'Failed to erase transactions' });
  }
});

// ─── DELETE /api/transactions/:id ─────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    await Transaction.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    console.error('[DELETE /transactions/:id]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete transaction' });
  }
});

export default router;
