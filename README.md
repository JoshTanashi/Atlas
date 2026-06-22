# Atlas

A calm, honest personal financial journal — manual 3-tap logging, a daily timeline, and progressively-unlocked savings rate / net worth / runway / goal / debt-payoff math. ZAR-first, built for the South African market.

This build covers Phase 0+1 of the concept ("The Journal"): logging, timeline, search, goals, and the full progressive baseline. No AI insights, forecasting, or paywall — that's a later phase.

## Stack

- Vite + React 19, plain JavaScript, no router library (custom history-API navigation in `src/lib/nav.js`)
- Supabase: Postgres + Auth + Row Level Security + one Edge Function (`delete-account`)
- `idb` for an offline read cache; writes require connectivity (no background sync queue yet)
- `vite-plugin-pwa` for an installable PWA
- Vitest for formula/regression tests

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon/publishable key
npm run dev
npm run test
```

## Database

Schema and RLS policies live in `supabase/migrations/`. Apply them to a Supabase project with the Supabase CLI or MCP tooling. The `delete-account` Edge Function (in `supabase/functions/delete-account/`) needs the project's `SUPABASE_SERVICE_ROLE_KEY` available as a function secret (set automatically by Supabase for every project) to fully delete a user's `auth.users` row; every table cascades from there via foreign keys.

Before going live, double check in the Supabase dashboard (Authentication → Providers/Policies — these aren't exposed via API):
- "Confirm email" is enabled
- Minimum password length is at least 8
- Leaked-password protection is enabled (Pro plan)

## Deployment

Deploys as a static site to Vercel. `vercel.json` handles the SPA rewrite and security headers (CSP, X-Frame-Options, etc). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel project environment variables — never commit real values to `.env.local`.

## Money handling

All amounts are stored and computed as integer cents (`bigint` in Postgres, plain numbers in JS) and only formatted to Rands at render time (`src/lib/money.js`), to avoid floating-point drift.

## Formulas

`src/lib/formulas.js` — savings rate, net worth, emergency-fund runway, goal projection (target-date or contribution-rate mode), and debt amortization. Each has a hard-coded regression test in `src/tests/formulas.test.js` against worked numeric examples.
