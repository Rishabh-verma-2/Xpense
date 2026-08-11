import mongoose from 'mongoose';
import { config } from './env';

// ─── Connection options ────────────────────────────────────────────────────────
const MONGOOSE_OPTS: mongoose.ConnectOptions = {
  dbName: config.mongo.dbName,
  serverSelectionTimeoutMS: 10_000, // timeout after 10s if can't connect
  socketTimeoutMS: 45_000,
};

// ─── State ────────────────────────────────────────────────────────────────────
let isConnected = false;

// ─── Connect ──────────────────────────────────────────────────────────────────
export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('🔄  MongoDB already connected');
    return;
  }

  try {
    await mongoose.connect(config.mongo.uri, MONGOOSE_OPTS);
    isConnected = true;
    console.log(`✅  MongoDB connected — db: ${config.mongo.dbName}`);
  } catch (err) {
    console.error('❌  MongoDB connection error:', err);
    process.exit(1); // crash fast — don't run without a DB
  }
}

// ─── Disconnect (for tests / graceful shutdown) ───────────────────────────────
export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('🔌  MongoDB disconnected');
}

// ─── Event listeners ─────────────────────────────────────────────────────────
mongoose.connection.on('error', (err) => {
  console.error('❌  Mongoose error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️   MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

export default mongoose;
