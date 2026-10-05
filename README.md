# Reward Wiz

A rewards checker that finds the money you're leaving on the table: duplicate
subscriptions, carrier perks you forgot you had, and card benefits you never
activated.

Born as PointPilot (a travel-rewards comparison engine) — the trip comparison
features still live here under `/compare`, and Reward Wiz adds the
subscriptions-and-perks side of maximizing rewards.

## What it does

- **/scan** — a three-step wizard: your subscriptions (searchable catalog +
  custom adds), your credit cards, your phone plan.
- **/dashboard** — the scan results ranked by yearly savings:
  - **Duplicates** — two active bills for the same service ("HBO Max" and
    "Max" collide correctly via alias groups)
  - **Forgotten perks** — a paid service already included by a carrier plan
    (T-Mobile → Netflix "On Us", Apple TV+) or a card (Amex entertainment
    credit, Chase DashPass, …); savings are capped at what you actually pay
  - **Offers** — curated offers that match something you already pay for
- Anonymous users get the full scan with `localStorage` persistence; signing
  in moves the profile and match statuses to Supabase.

The rules engine (`src/lib/rewards-engine.ts`) is pure and deterministic — it
runs in the browser today and can move to a background job unchanged. The
hand-curated catalog (`src/lib/rewards-catalog.ts`) carries source URLs for
every bundle rule and perk; dollar values are estimates (Sep 2026 list
prices). Phase 3 replaces the catalog with live feeds.

## Stack

TanStack Start (React 19 + TS) · Tailwind 4 + shadcn/ui · Supabase
(auth + Postgres + RLS) · Cloudflare (wrangler). Browser extension sources in
`extension/` (PointPilot balance auto-sync — unrelated to Reward Wiz scans).
Plaid (sandbox) for bank connections — see below.

## Getting started

```bash
npm ci
cp .env.example .env    # fill in Plaid sandbox keys (see below)
npm run dev        # http://localhost:3000
npm test           # vitest (engine + recurring + programs)
npm run build      # production build (.output, nitro/cloudflare)
```

### Plaid bank connection (sandbox prototype)

`/accounts` connects a bank via Plaid Link and surfaces **recurring charges**
(`src/lib/recurring.ts`), which feed the rewards scan.

1. Sign up at https://dashboard.plaid.com (free — Trial plan covers up to 10
   connected production items)
2. Copy your **sandbox** keys from Team Settings → Keys into `.env`
3. `npm run dev` → open `/accounts` → **Connect your bank**
4. In the Link modal choose **First Platypus Bank** and log in with
   `user_good` / `pass_good`, then **Pull transactions**

Secrets stay server-side: `src/lib/plaid-server.ts` is imported only by server
functions and reads `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` (no
`VITE_` prefix, so they never reach the client bundle).

PROTOTYPE SECURITY NOTE: the access token returned by the exchange is kept in
the browser's localStorage. Fine for sandbox; real tokens must be vaulted
server-side before this ships.

### Database

Migrations live in `supabase/migrations/` and apply in filename order:

1. `20260419121445_*.sql` — PointPilot core (`profiles`, `reward_accounts`,
   `saved_trips`) + `set_updated_at()` helper
2. `20260924120000_reward_wiz_phase1.sql` — Reward Wiz (`subscriptions`,
   `credit_cards`, `offers`, `bundle_rules`, `matches`) with per-user RLS

Apply with `supabase db push` or paste the SQL into the dashboard SQL editor.
After changing the schema, regenerate types with
`supabase gen types typescript --local > src/integrations/supabase/types.ts`
(the committed types file is checked in).

### Deploy

Builds to `.output/` via nitro. Deploy to Cloudflare Pages with the wrangler
config in `wrangler.jsonc` (`npx nitro deploy --prebuilt`).

## Roadmap

- **Phase 1 (this branch)** — rules engine, curated catalog, scan wizard,
  savings dashboard
- **Phase 2** — carrier plans get a real table, offer alerts, PointPilot →
  Reward Wiz rebrand
- **Phase 3** — bank sync (Plaid), email receipt parsing, live offer feeds

## Disclaimer

Savings figures are estimates for prioritization, not financial advice.
Always confirm terms with the provider before cancelling anything.
