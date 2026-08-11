import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User, Transaction, Category, Budget, Goal } from '../models';

const router = Router();

// ─── GET /health ──────────────────────────────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'Xpense API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// ─── GET /health/db ───────────────────────────────────────────────────────────
router.get('/db', async (_req: Request, res: Response) => {
  try {
    const state = mongoose.connection.readyState;
    const stateLabel: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    if (state !== 1) {
      return res.status(503).json({
        success: false,
        db: {
          status: stateLabel[state] ?? 'unknown',
          message: 'MongoDB is not connected',
        },
      });
    }

    // Ping
    await mongoose.connection.db!.admin().ping();

    // Actual count from Mongoose models
    const userCount = await User.countDocuments();
    const txCount = await Transaction.countDocuments();
    const catCount = await Category.countDocuments();
    const budgetCount = await Budget.countDocuments();
    const goalCount = await Goal.countDocuments();

    // List collections directly from database instance
    const collections = await mongoose.connection.db!.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    return res.json({
      success: true,
      db: {
        status: 'connected',
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        ping: 'ok',
        collectionsFound: collectionNames,
        counts: {
          users: userCount,
          transactions: txCount,
          categories: catCount,
          budgets: budgetCount,
          goals: goalCount,
        },
      },
    });
  } catch (err: any) {
    console.error('[health/db]', err);
    return res.status(500).json({
      success: false,
      db: { status: 'error', message: err.message },
    });
  }
});

export default router;
