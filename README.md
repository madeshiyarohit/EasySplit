# SplitEasy

A premium, production-grade expense-splitting app (Splitwise-style), built with Next.js 14+ App Router, Tailwind, Prisma/Postgres (Supabase), and an Apple-grade design system.

## Stack

- **Framework:** Next.js (App Router, TypeScript, strict mode)
- **Styling:** Tailwind CSS v4 + hand-rolled shadcn-style components (CVA + Radix conventions)
- **Database:** PostgreSQL via Supabase, accessed through Prisma
- **Auth:** Supabase Auth (phone OTP primary, email secondary) — UI flow is built; wire real Supabase project credentials to activate it
- **Background jobs:** Inngest, for notification fan-out (`app/api/inngest/route.ts`)
- **State:** React Server Components by default; Zustand for the add-expense wizard
- **Forms:** react-hook-form + zod (validation wiring points are in `lib/`)
- **Animation:** Framer Motion, spring-based micro-interactions throughout

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs and is fully click-through-able **without any external service keys** — screens use `lib/mock-data.ts` for content, and every notification channel adapter falls back to a `console.log` mock send when its API key is absent.

### Wiring real services

Fill in `.env` (see `.env.example`) with your own keys, then:

1. **Database** — set `DATABASE_URL` to your Supabase Postgres connection string, then:
   ```bash
   npx prisma migrate dev --name init
   ```
2. **Auth** — set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project. The phone-OTP screen (`components/auth/otp-login.tsx`) currently simulates the flow client-side; swap in `supabase.auth.signInWithOtp` / `verifyOtp` calls using `lib/supabase/client.ts`.
3. **Notifications** — set whichever of `RESEND_API_KEY`, `FCM_SERVER_KEY`, `GUPSHUP_API_KEY` + `GUPSHUP_SOURCE_NUMBER`, `MSG91_AUTH_KEY` + `MSG91_FLOW_ID` you have. Each channel is an independent adapter in `lib/notifications/channels/`; add or remove one by editing the `PRIMARY_ADAPTERS` array in `lib/notifications/notification-service.ts` — no other code changes needed. SMS (MSG91) is deliberately a fallback, sent only when every primary channel attempt fails.
4. **Background jobs** — set `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`, then run `npx inngest-cli@latest dev` alongside `npm run dev` to test fan-out locally.

## Core logic

- **Debt simplification:** `lib/split/simplifyDebts.ts` — a pure function reducing a group's net balances to the minimum number of settling transactions. Fully unit tested in `lib/split/simplifyDebts.test.ts`.
- **Split calculation:** `lib/split/splitAmount.ts` — equal / unequal / percentage / shares splitting, always allocating rounding remainders deterministically so shares sum exactly to the total. Tested in `lib/split/splitAmount.test.ts`.

Run the test suite:

```bash
npm test
```

## Project structure

```
app/
  (auth)/login/        Phone-OTP login screen
  (app)/dashboard/      Overview: balances, groups, activity feed
  (app)/groups/[id]/    Group detail: balances, expense history, settle up
  (app)/expenses/new/   Multi-step add-expense wizard
  (app)/settings/       Profile, theme, notification preferences
  api/inngest/          Inngest webhook handler
components/
  ui/                   Base design-system primitives (Button, Card, Avatar, ...)
  auth/, dashboard/, group/, expense/, settings/, layout/
lib/
  split/                Debt simplification + split-amount pure functions (tested)
  notifications/        Pluggable NotificationService + channel adapters
  inngest/              Inngest client + background functions
  supabase/             Supabase browser/server/middleware clients
  store/                Zustand stores
  mock-data.ts          Demo data powering every screen out of the box
prisma/
  schema.prisma         Data model (User, Group, Expense, ExpenseSplit, Settlement, AuditLog)
```

## Design system

Theme tokens (light/dark) live in `app/globals.css` as CSS variables — a neutral near-black/near-white base with a single indigo accent, generous 8px-scale spacing, `rounded-2xl`/`rounded-3xl` corners, and soft low-opacity shadows. The light/dark/system toggle (`components/theme-toggle.tsx`) persists via `next-themes` and every component reads from the CSS variables, so there are no hardcoded colors to break in dark mode.
