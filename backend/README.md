# Xpense Backend

Express + TypeScript + Prisma REST API for the Xpense mobile app.

## Quick Start

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Copy & edit env
cp .env.example .env

# 3. Generate Prisma client & run migrations
npm run db:generate
npm run db:migrate      # creates dev.db (SQLite)

# 4. (Optional) Seed demo data
npm run db:seed

# 5. Start dev server
npm run dev
```

Server starts at **http://localhost:3000**

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user profile |

### Transactions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/transactions` | ✅ | List (filter: month, year, type, categoryId) |
| POST | `/api/transactions` | ✅ | Create transaction |
| PUT | `/api/transactions/:id` | ✅ | Update transaction |
| DELETE | `/api/transactions/:id` | ✅ | Delete transaction |
| GET | `/api/transactions/summary` | ✅ | Monthly income/expense summary |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | ✅ | List all categories |
| POST | `/api/categories` | ✅ | Create custom category |
| PUT | `/api/categories/:id` | ✅ | Update category |
| DELETE | `/api/categories/:id` | ✅ | Delete category |

### Budgets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/budgets` | ✅ | Budgets with actual spent amounts |
| POST | `/api/budgets` | ✅ | Create or update budget |
| DELETE | `/api/budgets/:id` | ✅ | Delete budget |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/monthly` | ✅ | 12-month income/expense per year |
| GET | `/api/analytics/category` | ✅ | Expense breakdown by category |

---

## Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma        # DB schema (User, Transaction, Category, Budget, Goal)
│   └── seed.ts              # Demo data seeder
├── src/
│   ├── config/
│   │   ├── database.ts      # Prisma singleton
│   │   └── env.ts           # Typed config from .env
│   ├── middleware/
│   │   ├── auth.ts          # JWT authenticate middleware
│   │   └── errorHandler.ts  # Global error + 404 handler
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   ├── categories.ts
│   │   ├── budgets.ts
│   │   └── analytics.ts
│   └── index.ts             # App entry point
├── .env.example
├── package.json
└── tsconfig.json
```

## Auth Flow

All protected routes require: `Authorization: Bearer <token>`

Tokens are returned from `/api/auth/login` and `/api/auth/register`.

## Database

- **Dev**: SQLite (`prisma/dev.db`) — zero config, just run `npm run db:migrate`
- **Prod**: PostgreSQL — change `provider = "postgresql"` in `schema.prisma` and update `DATABASE_URL`
