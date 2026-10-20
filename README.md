# RideHive 🚗🐝

> Campus ride-pooling mobile application for BML Munjal University, Gurugram.

RideHive helps university students share cabs to common off-campus transit destinations (IGI Airport, New Delhi / Gurugram railway stations, Huda City Centre / Millennium City metro station, Cyber Hub, Ambience Mall, etc.). Students save on fares, cabs run at full capacity, and ride coordination happens frictionlessly with real-time updates and an automated fare ledger.

---

## Architecture & Tech Stack

- **Mobile Frontend (`app/`)**: React Native with Expo SDK 52+, TypeScript in strict mode, Expo Router, TanStack Query, Zustand, React Hook Form + Zod, FlashList, `@gorhom/bottom-sheet`, `react-native-maps`, Lucide icons, Inter typography.
- **Backend (`supabase/`)**: PostgreSQL with PostGIS, Supabase Auth (Email OTP restricted to `@bmu.edu.in`), Realtime replication, Row-Level Security (RLS) on all tables, Edge Functions (Deno proxying Google Places & Routes), `pg_cron` jobs.
- **Tooling & Quality**: ESLint, Prettier, Jest + React Native Testing Library, pgTAP tests, GitHub Actions CI.

---

## Repository Structure

```
ridehive/
├── app/                  # Expo mobile client
│   ├── app/              # Expo Router routes
│   └── src/              # Feature modules, design system, tokens, lib
├── supabase/             # Backend database migrations, functions, tests
├── docs/                 # ARCHITECTURE.md, DECISIONS.md, PROGRESS.md
├── .github/workflows/    # CI pipeline
└── README.md
```

---

## Prerequisites

1. **Node.js**: v20 or later (`v22` recommended).
2. **Git**: Recent version with conventional commit standard.
3. **Supabase CLI**: Installed globally or invoked via `npx supabase`.
4. **Docker Desktop**: Required to run Supabase locally (PostgreSQL + PostGIS).
5. **Expo CLI**: Invoked via `npx expo`.

---

## Local Development Setup

### 1. Backend (Supabase)
```bash
# Start local Supabase containers
npx supabase start

# Apply migrations and seed data
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > app/src/types/database.ts
```

### 2. Frontend (Expo)
```bash
cd app
npm install
cp ../.env.example .env
# Edit .env with your local Supabase URL and Anon key
npx expo start
```

---

## Production Supabase Configuration

### Custom SMTP Provider Setup (Crucial)
In production, Supabase Auth's default email service is restricted to a low rate limit (roughly 3-4 emails/hour). Before real use on campus:
1. Navigate to **Project Settings > Auth > SMTP Settings** in your Supabase Dashboard.
2. Enable **Custom SMTP** and connect your university or transactional email provider (SendGrid, Postmark, AWS SES, or Brevo).
3. Under **Auth > Email Templates > Magic Link / Confirmation**, update the subject and message body to present the 6-digit verification code directly:
   ```html
   <h2>RideHive Verification Code</h2>
   <p>Your one-time campus login code is:</p>
   <h1 style="letter-spacing: 4px; font-family: monospace;">{{ .Token }}</h1>
   <p>This code will expire in 10 minutes. Do not share it with anyone.</p>
   ```
   *Note: RideHive mobile app uses `signInWithOtp` and `verifyOtp` requiring the 6-digit `{{ .Token }}` instead of redirect magic links.*

---

## CI / Testing
```bash
# Typecheck mobile app
cd app && npm run typecheck

# Lint mobile app
cd app && npm run lint

# Run unit tests
cd app && npm test
```
