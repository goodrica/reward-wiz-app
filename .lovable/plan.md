
# Plan: Make the Extension Feel Like a One-Stop Shop

Goal: minimize user effort. Today the user has to (1) visit each loyalty site, (2) open the popup, (3) click **Sync**. We'll cut that to "visit the site — everything else happens by itself," and broaden coverage so a single visit-cycle captures most of a traveler's points.

## 1. Auto-sync on detection (kill the Sync button for trusted matches)

- When a content script reports a balance with **confidence ≥ 0.85**, the background worker syncs it to the backend automatically — no popup interaction needed.
- Balances with confidence 0.6–0.85 sync automatically only if the value is **unchanged from a previous high-confidence reading** (sanity check).
- Low-confidence (<0.6) balances still require a manual click in the popup, shown with a "Needs review" badge.
- Popup still lets the user force a sync, and shows a small "Last auto-synced 2 min ago" line per program.

## 2. Background session keep-alive + per-program sync state

- New `chrome.storage.local` entry: `sync_state[program] = { lastValue, lastSyncedAt, lastConfidence, lastUrl }`.
- Background worker dedupes: if value + confidence haven't improved since last sync, skip the network call.
- Adds a tiny badge on the extension icon: green dot when everything is fresh (<30 days), amber when stale, red on sync failure.

## 3. Expand program coverage

Add content scripts + parsers for the highest-value programs travelers actually hold:

- **Hotels:** Hilton Honors, World of Hyatt, IHG One Rewards, Wyndham, Choice.
- **Airlines:** United MileagePlus, American AAdvantage, Alaska Mileage Plan, Southwest Rapid Rewards.
- **Transferable currencies:** Amex Membership Rewards, Chase Ultimate Rewards, Capital One Miles, Citi ThankYou, Bilt.

Each follows the existing pattern (selectors → aria → JSON blocks → label proximity → regex), with confidence scoring already in place.

## 4. "Open all my programs" power action

- New popup button: **Refresh all** → opens each registered program's balance page in background tabs, lets the content script detect + auto-sync, then closes the tab.
- Uses `chrome.tabs.create({ active: false })` and a 15-second timeout per tab.
- One click → every balance refreshed. Closest thing to a true "one button to rule them all" without storing credentials.

## 5. Staleness nudges

- If a program hasn't synced in 30+ days, show it at the top of the popup with a **"Refresh now"** link that opens that program's site in a new tab. (Cheaper, less spammy than browser notifications.)
- Optional notification toggle (off by default) for users who want push reminders.

## 6. Onboarding & install polish

- First-run popup state: short checklist showing which programs are detected vs. not yet seen, with one-click links to each program's balance page.
- Re-package `public/pointpilot-extension.zip` so the marketing site download stays current.

---

## Technical notes (for the build phase)

**Files touched:**
- `extension/background.js` — auto-sync logic, badge state, sync_state cache.
- `extension/lib/config.js` — register new programs (slug, name, type, balance URL).
- `extension/content/<program>.js` — one file per new program (hilton, hyatt, ihg, united, aa, alaska, southwest, wyndham, choice, amex-mr, chase-ur, capitalone, citi, bilt).
- `extension/lib/parsers.js` — small helper: `autoSyncIfConfident(hit, program)` posting straight to the backend via stored session token (already wired in popup.js — we'll extract `pgFetch` + `syncBalance` into `extension/lib/api.js` so background.js can call them too).
- `extension/popup.html` / `popup.js` / `popup.css` — "Refresh all" button, staleness section, auto-sync indicator.
- `extension/manifest.json` — add host_permissions for each new program domain.
- `public/pointpilot-extension.zip` — repackage.
- `src/routes/account.tsx` — show "Auto-synced" vs "Manually synced" badge next to `last_sync_source` (purely cosmetic — schema already has the column).

**No DB migration required.** All metadata columns we need (`last_sync_source`, `last_sync_method`, `last_sync_confidence`, etc.) already exist.

**Auth:** session token is already persisted in `chrome.storage.local` by `popup.js`. Background worker will reuse `refreshIfNeeded()` from the shared `api.js` module — no new credential handling.

**Scope guard:** This plan is extension-only + a tiny cosmetic tweak on the account page. No backend, schema, or auth changes.

---

## Out of scope (per your answers)

- Gmail OAuth email parsing — parked for a later phase.
- AwardWallet/aggregator API — parked.
- Server-side scraping with stored credentials — you're open to it long-term, but we'll revisit once the extension is fully polished; it's a much bigger security/legal lift and shouldn't block UX improvements.

Want me to build this as one batch, or split it (1–2 first, then coverage, then "Refresh all")?
