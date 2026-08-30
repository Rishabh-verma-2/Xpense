# 🚀 Xpense Backend API

High-performance REST API powering the Xpense cross-platform application. Built with **Express**, **TypeScript**, and **MongoDB Atlas** (via Mongoose), featuring cloud-native email security with the official **Brevo Node SDK** (`@getbrevo/brevo`).

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript (`ts-node-dev`)
- **Database**: MongoDB Atlas via Mongoose ORM
- **Email Delivery**: Brevo HTTP REST API (`@getbrevo/brevo`, Port 443) with IPv4 Gmail SMTP fallback
- **Authentication**: JSON Web Tokens (JWT) + `bcryptjs`
- **Security**: Helmet, CORS origin whitelisting, rate limiting

---

## ⚡ Quick Start

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, and BREVO_API_KEY

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
npm start
```

*Server starts on `http://localhost:3000` (or `PORT` specified in `.env`).*

---

## 🔑 Environment Variables

```env
PORT=3000
NODE_ENV=development

# MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/xpense?retryWrites=true&w=majority
MONGO_DB_NAME=xpense

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Brevo (Email Delivery over HTTPS Port 443)
BREVO_API_KEY=xkeysib-your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender@gmail.com

# Gmail SMTP Fallback (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

---

## 🌐 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | ❌ | Create new user account |
| `POST` | `/api/auth/login` | ❌ | Login with email/phone & password |
| `POST` | `/api/auth/google` | ❌ | Authenticate with Google ID token |
| `GET` | `/api/auth/me` | 🔐 | Fetch current authenticated user |
| `PUT` | `/api/auth/profile` | 🔐 | Update user profile details |
| `PUT` | `/api/auth/change-password` | 🔐 | Change password with current verification |
| `POST` | `/api/auth/forgot-password` | ❌ | Request 6-digit OTP verification email |
| `POST` | `/api/auth/reset-password-otp` | ❌ | Reset password using 6-digit OTP |

### 💰 Transactions (`/api/transactions`)
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/transactions` | 🔐 | List transactions (supports pagination & month filter) |
| `POST` | `/api/transactions` | 🔐 | Create income or expense record |
| `GET` | `/api/transactions/:id` | 🔐 | Fetch single transaction |
| `PUT` | `/api/transactions/:id` | 🔐 | Update transaction details |
| `DELETE` | `/api/transactions/:id` | 🔐 | Delete transaction |

### 🏷️ Categories (`/api/categories`)
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/categories` | 🔐 | List system & user custom categories |
| `POST` | `/api/categories` | 🔐 | Create custom category |
| `PUT` | `/api/categories/:id` | 🔐 | Update category |
| `DELETE` | `/api/categories/:id` | 🔐 | Delete custom category |

### 📊 Analytics (`/api/analytics`)
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/analytics/monthly` | 🔐 | 12-month grouped income vs expense summary |
| `GET` | `/api/analytics/categories` | 🔐 | Category spend breakdown with percentages |

### 🏥 System Health (`/health`)
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/health` | ❌ | Server health status & uptime |
| `GET` | `/health/db` | ❌ | MongoDB connection status and document counts |
