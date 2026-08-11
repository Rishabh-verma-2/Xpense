# Xpense — Full Stack Monorepo

React Native (Expo) app + Express/TypeScript backend.

## Structure

```
Xpense/
├── src/           # React Native frontend (Expo)
├── assets/        # App icons & images
├── backend/       # Node.js REST API  ← NEW
└── app.json
```

## Running

### Mobile App
```bash
# from root
npm start
```

### Backend API
```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

See [backend/README.md](./backend/README.md) for full API docs.
