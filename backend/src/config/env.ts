import dotenv from 'dotenv';
dotenv.config();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`❌  Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

// ─── MongoDB URI ──────────────────────────────────────────────────────────────
// If MONGO_URI contains the literal "<password>", replace it with MONGO_PASSWORD
function buildMongoUri(): string {
  const uri = optional('MONGO_URI', '');
  if (!uri) throw new Error('❌  MONGO_URI is not set in your .env file');

  const password = optional('MONGO_PASSWORD', '');
  if (uri.includes('<password>') && !password) {
    throw new Error('❌  MONGO_URI contains <password> but MONGO_PASSWORD is not set');
  }

  return password ? uri.replace('<password>', encodeURIComponent(password)) : uri;
}

// ─── Exported config ──────────────────────────────────────────────────────────
export const config = {
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),

  mongo: {
    uri: buildMongoUri(),
    dbName: optional('MONGO_DB_NAME', 'xpense'),
  },

  jwt: {
    secret: optional('JWT_SECRET', 'change-me-in-production'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },

  cors: {
    origins: optional('ALLOWED_ORIGINS', 'http://localhost:8081')
      .split(',')
      .map((o) => o.trim()),
  },

  email: {
    user: optional('EMAIL_USER', ''),
    pass: optional('EMAIL_PASS', ''),
    host: optional('EMAIL_HOST', 'smtp.gmail.com'),
    port: parseInt(optional('EMAIL_PORT', '587'), 10),
    secure: optional('EMAIL_SECURE', 'false') === 'true',
    brevoApiKey: optional('BREVO_API_KEY', ''),
    brevoSenderEmail: optional('BREVO_SENDER_EMAIL', optional('EMAIL_USER', '')),
  },
};
