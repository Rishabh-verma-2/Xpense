# 💸 Xpense - Modern Expense & Income Tracker

A sleek, feature-packed React Native (Expo) personal finance app featuring a modern glassmorphism design system, dark mode aesthetics, interactive reports, budget tracking, and offline storage.

---

## ✨ Features

- 📊 **Dynamic Dashboard**: Real-time spending overview, balance tracking, budget status, and recent activity.
- 💳 **Transaction Management**: Easily add, edit, search, and filter expenses and income.
- 📈 **Visual Reports & Analytics**: Monthly and yearly breakdown charts powered by `react-native-gifted-charts`.
- 🎯 **Budgets & Goals**: Set category spending limits and monitor budget health with interactive progress indicators.
- ⚙️ **Customization & Settings**: Multi-currency support, custom category management, export data (CSV/JSON), and theme preferences.
- 🔒 **Privacy-First Storage**: Local persistence using `@react-native-async-storage/async-storage` and `expo-secure-store`.

---

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native 0.81)
- **Language**: TypeScript
- **Navigation**: React Navigation 7 (Native Stack & Bottom Tabs)
- **Charts & Data Viz**: `react-native-gifted-charts` & `react-native-svg`
- **UI & Icons**: Vanilla React Native Stylesheet, `expo-linear-gradient`, `@expo/vector-icons`
- **State Management**: React Context API

---

## 📁 Project Structure

```
src/
├── context/              # Global React Contexts (Transactions, Categories, Settings)
├── core/
│   ├── navigation/       # Navigation Stack & Tab definitions
│   └── theme/            # Design system, colors, spacing, typography
├── features/
│   ├── budgets/          # Budget management screens
│   ├── categories/       # Category management screens
│   ├── dashboard/        # Home dashboard screen
│   ├── export/           # Data export functionality
│   ├── history/          # Transaction history list & search
│   ├── reports/          # Monthly, yearly & drilldown charts
│   ├── settings/         # App settings & preferences
│   └── transactions/     # Add/Edit/Detail transaction screens
├── shared/
│   ├── components/       # Reusable UI components (AppButton, ScreenHeader, etc.)
│   ├── constants/        # App constants
│   ├── types/            # TypeScript type declarations
│   └── utils/            # Helper utilities (currency, date formatters, validators)
└── storage/              # Local storage helpers (AsyncStorage & SecureStore)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn / pnpm
- Expo Go app on iOS/Android or an emulator

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rishabh-verma-2/Xpense.git
   cd Xpense
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

---

## 📜 Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **Start** | `npm start` | Run Expo bundler |
| **Android** | `npm run android` | Open app in Android emulator |
| **iOS** | `npm run ios` | Open app in iOS simulator |
| **Web** | `npm run web` | Run web preview |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
