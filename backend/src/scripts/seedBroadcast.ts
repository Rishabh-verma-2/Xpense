import { connectDB, disconnectDB } from '../config/database';
import { Notification } from '../models/Notification';

async function main() {
  console.log('📡 Connecting to MongoDB Atlas...');
  await connectDB();

  const title = '🚀 New Feature: Smart Budget Alerts & 8:00 PM Reminders!';
  const body = 'Automated 80% & 100% budget limit warnings and a daily 8:00 PM evening expense reminder are now live! Tap to configure your alerts.';

  // Check if broadcast already exists
  const existing = await Notification.findOne({ userId: null, title });
  if (existing) {
    console.log('ℹ️  Broadcast notification already exists in MongoDB Atlas:', existing.id);
  } else {
    const created = await Notification.create({
      userId: null, // Broadcast to all users
      title,
      body,
      type: 'system',
      data: { feature: 'notifications_v1', time: '20:00' },
    });
    console.log('✅  Broadcast notification successfully pushed to all users in database:', created.id);
  }

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Broadcast script error:', err);
  process.exit(1);
});
