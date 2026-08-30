import dns from 'dns';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';

// Force Node.js DNS resolver to prioritize IPv4 (fixes ENETUNREACH on networks/cloud hosts without IPv6)
if (typeof (dns as any).setDefaultResultOrder === 'function') {
  (dns as any).setDefaultResultOrder('ipv4first');
}
import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';

// ─── Route imports ────────────────────────────────────────────────────────────
import healthRoutes      from './routes/health';
import authRoutes        from './routes/auth';
import transactionRoutes from './routes/transactions';
import categoryRoutes    from './routes/categories';
import budgetRoutes      from './routes/budgets';
import analyticsRoutes   from './routes/analytics';
import notificationRoutes from './routes/notifications';
import goalRoutes         from './routes/goals';

const app = express();

// ─── Security & logging ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// Always allow the Vercel frontend + localhost in addition to any ALLOWED_ORIGINS
const ALWAYS_ALLOWED = [
  'https://xpense-blush.vercel.app',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:19006',
];
const allowedOrigins = [...new Set([...ALWAYS_ALLOWED, ...config.cors.origins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (config.nodeEnv !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/health',           healthRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories',   categoryRoutes);
app.use('/api/budgets',      budgetRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/goals',        goalRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`\n🚀  Xpense API  →  http://localhost:${config.port}`);
    console.log(`🏥  DB health   →  http://localhost:${config.port}/health/db`);
    console.log(`📦  Env         →  ${config.nodeEnv}\n`);
  });
}

bootstrap();
export default app;
