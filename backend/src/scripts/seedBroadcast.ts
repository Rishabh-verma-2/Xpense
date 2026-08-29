import { connectDB, disconnectDB } from '../config/database';
import { Notification } from '../models/Notification';

async function main() {
  console.log('📡 Connecting to MongoDB Atlas...');
  await connectDB();

  const title = '✨ Update Live: Smart Budget Alerts & 8:00 PM Reminders Active!';
  const body = 'Smart budget threshold warnings, 8:00 PM daily expense logging reminders, and navigation fixes are now live! Tap to test your alerts.';

  const created = await Notification.create({
    userId: null, // Broadcast to all users
    title,
    body,
    type: 'system',
    data: { feature: 'notifications_v2', timestamp: new Date().toISOString() },
  });
  console.log('✅  New manual broadcast notification successfully pushed to all users:', created.id);

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Broadcast script error:', err);
  process.exit(1);
});
