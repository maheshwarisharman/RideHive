# RideHive Architecture Decision Records (ADR)

This document records key product, technical, and operational decisions made during development.

---

## ADR-001: Monorepo Structure (`app/` and `supabase/`)
- **Date**: 2026-10-20
- **Context**: The product consists of a React Native (Expo) mobile frontend, Supabase database schema and migrations, Edge Functions, and shared configurations.
- **Decision**: Keep the repository root as the coordinator with `app/` hosting the Expo application and `supabase/` hosting database migrations, seed data, and Edge Functions.
- **Consequences**: Easy to maintain version parity, generate TypeScript types directly from Supabase into `app/src/types/database.ts`, and test in unified CI workflows.

---

## ADR-002: BML Munjal University Campus Coordinates
- **Date**: 2026-10-20
- **Context**: The app defaults ride origin to the campus main gate.
- **Decision**: Set the default campus origin coordinate to:
  - Latitude: `28.24765`
  - Longitude: `76.81395`
  - Name: `BML Munjal University Main Gate, NH 48, Sidhrawali, Gurugram, Haryana 122413`
  - Status: Marked as `-- VERIFY` in seed data for fine-tuning by campus administrators.

---

## ADR-003: Currency and Fare Representation
- **Date**: 2026-10-20
- **Context**: Rides require fare estimation and post-ride exact splitting. Floating-point division leads to rounding errors and precision loss.
- **Decision**: Store all monetary values as integer **paise** (`1 INR = 100 paise`). Split remainders are distributed 1 paisa at a time across members so sum(settlements) = final_fare exactly.
- **Consequences**: Zero floating point errors in database or calculations.

---

## ADR-004: Concurrency Protection on Seat Allocation
- **Date**: 2026-10-20
- **Context**: When multiple students attempt to join a pool with 1 seat remaining simultaneously, race conditions can cause overselling.
- **Decision**: Joining is implemented strictly through the `join_pool` RPC executing `SELECT * FROM pools WHERE id = p_pool_id FOR UPDATE`. Confirmed members count is re-evaluated under lock before inserting into `pool_members`.

---

## ADR-005: Location Search & Google Maps Proxying
- **Date**: 2026-10-20
- **Context**: Google Places Autocomplete and Routes APIs require server secrets and incur costs per request. Exposing server keys on mobile is a security risk.
- **Decision**: Proxy all Places and Directions API requests through Supabase Edge Functions (`places-autocomplete`, `place-details`, `route`) with input validation, session tokens, and route caching. Mobile client only receives restricted Google Maps SDK keys for map tiles.
- **Consequences**: Secure API keys, lower billing through session tokens and server caching, seamless fallback to curated locations if the API is unreachable.

---

## ADR-006: Strict Light Theme & Restrained Visual Language
- **Date**: 2026-10-20
- **Context**: Brand identity requires an understated, highly functional aesthetic matching Uber Rider, avoiding generic AI-generated styles.
- **Decision**: Strictly light theme, monochromatic primary palette (`#000000` on `#FFFFFF`), `#F6F6F6` surfaces, hairline borders (`#E8E8E8`), 4pt spacing grid, Inter typography with tabular numbers, and zero decorative gradients or emojis.
