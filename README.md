# 🚀 Xpense — Personal Finance & Expense Tracker

[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_54-7C3AED?logo=react&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-SMTP_Security-007ACC?logo=gmail&logoColor=white)](https://nodemailer.com)
[![PWA](https://img.shields.io/badge/PWA-Add_to_Home_Screen-C084FC?logo=pwa&logoColor=white)](#-progressive-web-app-pwa)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Xpense** is a state-of-the-art, cross-platform personal finance management app built with **React Native (Expo SDK 54)** and an **Express/TypeScript + MongoDB Atlas** backend. Featuring a rich glassmorphic dark-mode interface, 60fps animations, Nodemailer email security, and full PWA installation support for iOS and Android.

---

## ✨ Features

### ⚡ 1-Tap Expense & Income Logging
- **Glowing Amount Display**: Live-formatting numpad entry with preset pills (+₹100, +₹500, +₹1,000).
- **Current-Month Backdating Date Picker**: Easily log missed expenses with a calendar picker strictly constrained to the current active month (*shortcuts for Today, Yesterday, 3 Days Ago*).
- **Payment Method & Notes**: Categorise entries under Cash, Credit Card, UPI, Debit Card, or Bank Transfer with custom notes.

### 📊 Rich Analytics & Reports
- **Glassmorphic Hero Overview**: Real-time Total Spent, Total Income, Net Cashflow, and Average Daily Burn Velocity.
- **Month-over-Month (MoM) Trend Pill**: Automatic percentage comparison against prior months (`↓ 14% less` or `↑ 8% more`).
- **Category Expenditure Progress Bars**: Color-coded spend bars with percentage distribution and top-category callouts.
- **12-Month Grouped Annual Comparisons**: Grouped bar charts comparing annual income vs expenses with peak month badges.

### 📄 Professional Exporting
- **PDF Statements**: Export beautifully styled financial statements complete with category breakdown tables and monthly totals.
- **CSV Data Logs**: Download raw CSV transaction logs ready for Excel analysis.

### 🔒 Authentication & Nodemailer Security
- **JWT + MongoDB Authentication**: Secure email/phone registration and login.
- **Google OAuth Integration**: Native Google Sign-In synchronized with MongoDB Atlas user records.
- **Nodemailer Email Reset OTP**: Forgot password workflow sending HTML 6-digit verification codes to the user's email via SMTP.
- **In-App Password Management**: Change password modal with eye toggles for password visibility.

### 📱 Progressive Web App (PWA)
- **Add to Home Screen**: Install Xpense directly on Android Chrome, iOS Safari, or Desktop without an app store download.
- **Offline Readiness**: Local caching and sync fallback options.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React Native (Expo SDK 54), React Native Web
- **Language**: TypeScript
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Styling**: Glassmorphism, HSL color tokens, `expo-linear-gradient`, `@expo/vector-icons`
- **Storage**: `@react-native-async-storage/async-storage`, `expo-secure-store`

### **Backend**
- **Runtime**: Node.js & Express
- **Language**: TypeScript (`ts-node-dev`)
- **Database**: MongoDB Atlas via Mongoose ORM
- **Email Service**: Nodemailer (SMTP with Gmail App Passwords)
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs` password hashing

---

## 📁 Repository Structure

```
Xpense/
├── src/                               # Frontend React Native App
│   ├── core/                          # Theme, navigation stack, global config
│   │   ├── navigation/                # RootNavigator, MainTabs, SettingsStack
│   │   └── theme/                     # HSL color tokens, typography, radius
│   ├── context/                       # AuthContext, TransactionContext, SettingsContext, ToastContext
│   ├── features/                      # Feature modules
│   │   ├── auth/                      # Login, Signup, NameSetup screens
│   │   ├── dashboard/                 # DashboardScreen, TransactionRow, Onboarding Modal
│   │   ├── history/                   # HistoryScreen, filter pills, search bar
│   │   ├── landing/                   # LandingScreen (PWA Add to Home Screen)
│   │   ├── onboarding/                # SplashScreen, OnboardingScreen slides
│   │   ├── reports/                   # MonthlyReport, YearlyReport, CategoryDrilldown
│   │   ├── settings/                  # SettingsScreen, AboutScreen, CurrencySettings
│   │   └── transactions/              # AddTransactionScreen, EditTransactionScreen
│   ├── shared/                        # Reusable components & utilities
│   │   ├── components/                # ChangePasswordModal, ForgotPasswordModal, CurrentMonthDatePickerModal, ExportModal
│   │   └── utils/                     # Currency formatters, date parsing, PDF/CSV engines
│   └── services/                      # Axios API client
│
├── backend/                           # Node.js + Express REST API
│   ├── src/
│   │   ├── config/                    # Env loader, MongoDB connection, Firebase Admin
│   │   ├── middleware/                # JWT authentication middleware
│   │   ├── models/                    # Mongoose User, Transaction, Category schemas
│   │   ├── routes/                    # Auth, Transactions, Categories, Export endpoints
│   │   ├── services/                  # Nodemailer emailService
│   │   └── index.ts                   # Server entry point
│   ├── .env.example                   # Environment variable template
│   └── package.json
│
├── assets/                            # App branding icons and assets
├── app.json                           # Expo configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **Expo Go** app on mobile (optional, for testing on iOS/Android device)

---

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `backend/`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables inside `backend/.env`:
   ```env
   PORT=3000
   NODE_ENV=development

   # MongoDB Atlas Connection
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/xpense?retryWrites=true&w=majority

   # JWT Auth
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d

   # Nodemailer SMTP Config (For Forgot Password Email OTP)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_char_gmail_app_password
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:3000`.*

---

### 2. Frontend Setup

1. From the project root directory, install frontend dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. Run on your preferred target:
   - **Press `w`** to open in Web Browser (PWA Mode).
   - **Press `i`** to open iOS Simulator.
   - **Press `a`** to open Android Emulator.
   - **Scan QR Code** using Expo Go app on your phone.

---

## 🌐 API Endpoint Summary

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | ❌ | Register new user account |
| `POST` | `/api/auth/login` | ❌ | Authenticate email/phone & password |
| `POST` | `/api/auth/google` | ❌ | Google OAuth token verification |
| `GET` | `/api/auth/me` | 🔐 | Fetch current authenticated user |
| `PUT` | `/api/auth/change-password` | 🔐 | Update account password |
| `POST` | `/api/auth/forgot-password` | ❌ | Dispatch Nodemailer 6-digit OTP email |
| `POST` | `/api/auth/reset-password-otp` | ❌ | Reset password using email OTP |
| `GET` | `/api/transactions` | 🔐 | List transactions (with month/year filters) |
| `POST` | `/api/transactions` | 🔐 | Create new expense or income |
| `PUT` | `/api/transactions/:id` | 🔐 | Update existing transaction |
| `DELETE` | `/api/transactions/:id` | 🔐 | Delete transaction |
| `GET` | `/api/categories` | 🔐 | List available transaction categories |

---

## 📱 Progressive Web App (PWA) Installation

Xpense is pre-configured for PWA installation:

- **Android / Chrome**: Tap **"Add to Home Screen"** or **"Install App"** on the landing screen to launch the native browser installation prompt.
- **iOS Safari**: Tap the **Share** button ➔ Select **"Add to Home Screen"** 📲.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p center="align">
  Designed & Crafted with ❤️ for Financial Freedom
</p>
