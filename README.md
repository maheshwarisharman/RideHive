# RideHive

> Restrained, production-ready campus ride-pooling mobile application for BML Munjal University, Gurugram.

RideHive solves the campus cab liquidity problem: BMU students travelling to Delhi-NCR transit hubs (IGI Airport, New Delhi / Gurugram Railway Stations, Millennium City Metro, Cyber Hub, Ambience Mall, etc.) often travel alone paying full cab fares (~₹600–₹1,500). RideHive allows students to create or join existing pools, coordinates riders through realtime group messaging, and handles fair, remainder-exact fare splitting with 1-tap UPI deep links.

---

## Key Highlights & Hard Invariants

1. **Monochromatic Uber-Rider Aesthetic**: Strict light theme only (`#000000`/`#FFFFFF`, `#F6F6F6` surfaces, `#E8E8E8` hairline borders, 4pt grid, Inter typography with tabular numerals). Zero gradients, emojis, or decorative blobs.
2. **3-Layer Domain Restriction**: Only `@bmu.edu.in` email addresses are admitted. Enforced client-side (Zod schema), server-side trigger/hook (`enforce_bmu_email_domain`), and database RLS.
3. **Integer Paise Financial Model**: All fares are stored and computed in integer paise (₹1 = 100 paise). When splitting uneven fares, remainder paise are allocated deterministically to members (+1 paise each) so the sum of individual shares matches the total bill to the exact paisa.
4. **Concurrency-Safe Seat Allocation**: Seat availability is protected by PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) within `SECURITY DEFINER` RPCs (`join_pool`, `leave_pool`), preventing race conditions when multiple riders join simultaneously.
5. **Secure Google Maps Proxying**: Google Places and Routes server API keys are restricted exclusively to Supabase Edge Functions. The mobile client never receives unmetered backend keys.

---

## System Architecture

```
                  ┌───────────────────────────────┐
                  │    RideHive Mobile Client     │
                  │ (Expo SDK 58 / React Native)  │
                  └──────────────┬────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │ HTTPS RPCs       │ Realtime PubSub  │ Edge Functions
              ▼                  ▼                  ▼
      ┌──────────────┐   ┌──────────────┐   ┌─────────────────────────┐
      │ PostgreSQL   │   │ Supabase     │   │ Deno Edge Functions     │
      │ 16 Tables    │   │ Realtime     │   │ - places-autocomplete   │
      │ PostGIS Ext  │   │ - Chat msgs  │   │ - place-details         │
      │ 12 RPCs      │   │ - Notifs     │   │ - route (proxy Google)  │
      └──────────────┘   └──────────────┘   └─────────────────────────┘
```

---

## Directory Structure

```
ridehive/
├── app/                              # Expo React Native mobile application
│   ├── app/                          # Expo Router file-based screens
│   │   ├── (auth)/                   # Sign-in, OTP verification, onboarding
│   │   ├── (tabs)/                   # Home, Rides & Ledger, Inbox, Account
│   │   ├── modals/                   # Create Pool, Search with filters
│   │   ├── pool/[id]/                # Pool Detail, Chat, Settlement
│   │   └── dev-showcase.tsx          # Design System token & primitive sandbox
│   ├── src/
│   │   ├── components/ui/            # 18 design system primitives
│   │   ├── features/
│   │   │   ├── auth/                 # Auth store, Zod schemas, session persistence
│   │   │   ├── chat/                 # Realtime group chat service & listeners
│   │   │   ├── maps/                 # Route preview map, polyline decoder, picker
│   │   │   ├── notifications/        # Push tokens, inbox notifications, alerts
│   │   │   ├── pools/                # Pool lifecycle, fare math, concurrency RPCs
│   │   │   ├── safety/               # Ratings, reports, blocks, security hotline
│   │   │   ├── search/               # PostGIS search_pools RPC integration
│   │   │   └── settlements/          # Paise split, UPI deep links, user ledger
│   │   ├── lib/                      # Supabase client, query client, formatters
│   │   └── theme/                    # Monochromatic Uber design tokens
│   └── eas.json                      # EAS build profiles (dev, preview, prod)
├── supabase/
│   ├── migrations/                   # Full PostgreSQL + PostGIS schema migration
│   ├── functions/                    # 3 Deno Edge Functions (Google Maps proxies)
│   ├── tests/                        # pgTAP database test suite
│   └── seed.sql                      # 16 verified NCR hubs + BMU coordinates
├── docs/
│   ├── ARCHITECTURE.md               # Technical architecture & schema specifications
│   ├── DECISIONS.md                  # Architectural Decision Records (ADRs)
│   └── PROGRESS.md                   # Phased implementation verification tracker
└── .github/workflows/ci.yml          # GitHub Actions CI workflow
```

---

## Getting Started

### Prerequisites
- Node.js 20+ (Node 22 LTS recommended)
- Docker Desktop (for local Supabase)
- Git

### 1. Backend Setup (Local Supabase)
```bash
# Start local PostgreSQL + PostGIS and Supabase containers
npx supabase start

# Apply database migration and seed data
npx supabase db reset

# Test PostgreSQL functions using pgTAP
npx supabase test db
```

### 2. Mobile App Setup (Expo)
```bash
cd app

# Install dependencies (respecting React 19 legacy-peer-deps configured in app/.npmrc)
npm install

# Start Expo dev server
npm start
```

---

## Testing & Quality Assurance

The codebase maintains strict typing and extensive test coverage:
- **Unit & Integration Tests**: 11 Jest test suites covering formatters, auth schemas, maps decoder, pool fare math, lifecycle RPCs, chat realtime, settlements exact split, notifications, and safety.
- **Static Typing**: TypeScript strict mode with zero compiler errors (`npm run typecheck`).
- **Linting**: ESLint configured with TypeScript rules (`npm run lint`).

```bash
cd app

# Run full unit test suite
npm test

# Run TypeScript strict typecheck
npm run typecheck

# Run ESLint validation
npm run lint
```

---

## Production Deployment

### 1. Supabase Custom SMTP Configuration
In production, Supabase Auth requires custom SMTP setup to avoid rate limits:
1. Go to **Supabase Dashboard > Authentication > SMTP Settings**.
2. Connect your university transactional provider (AWS SES, SendGrid, Postmark).
3. Update email template to display the 6-digit OTP code `{{ .Token }}`.

### 2. EAS Mobile Builds
```bash
cd app

# Development build (Simulator / APK)
npx eas build --profile development --platform all

# Internal preview build
npx eas build --profile preview --platform all

# Production release
npx eas build --profile production --platform all
```

---

## Safety & Trust Model

- **Campus Security Hotline**: Quick-dial hotline (`+91 124 267 1000`) available directly in the Account tab for 24/7 campus assistance.
- **Mutual Blocking**: When a rider is blocked, database RLS and query filters automatically exclude both parties from ever seeing or joining each other's pools.
- **Zero Public Contact Disclosure**: Phone numbers and UPI IDs are disclosed exclusively to confirmed co-members within the same active pool.
