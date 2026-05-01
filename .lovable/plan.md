# PointPilot Companion — Chrome Extension (MV3)

A small browser extension that, when you visit your loyalty program's website while logged in, reads your point balance off the page and syncs it to your PointPilot account.

## What it does

1. You install the unpacked extension (downloaded as a zip from PointPilot).
2. You sign in to PointPilot once inside the extension popup (same email/password as the web app).
3. You visit marriott.com, jetblue.com, delta.com, etc. while logged in to that program.
4. A content script detects the balance on the page, the popup shows it, and one click syncs it to your `reward_accounts` row.

No password sharing with PointPilot, no scraping behind login walls — the extension only reads what's already rendered in your own browser tab.

## Programs supported in v1

| Program            | URL pattern                  | Balance selector strategy                          |
|--------------------|------------------------------|----------------------------------------------------|
| Marriott Bonvoy    | `*://*.marriott.com/*`       | Account header / loyalty dashboard text match      |
| JetBlue TrueBlue   | `*://*.jetblue.com/*`        | Profile dropdown points node                       |
| Delta SkyMiles     | `*://*.delta.com/*`          | Header SkyMiles balance node                       |

Each site uses regex fallbacks (e.g. `/([\d,]+)\s*(points|miles)/i`) so we degrade gracefully if a class name changes. Detection runs on DOM mutations so it works on SPA navigation.

## Architecture

```text
extension/
├── manifest.json          MV3, permissions: storage, activeTab, scripting,
│                          host_permissions for the 3 program domains
├── popup.html / popup.js  Sign-in form + detected balance + Sync button
├── popup.css
├── background.js          Service worker: PointPilot auth token storage,
│                          message router between content script and popup
├── content/
│   ├── marriott.js        Per-site DOM readers
│   ├── jetblue.js
│   └── delta.js
├── lib/
│   ├── api.js             Calls Lovable Cloud (Supabase REST) with user JWT
│   └── parsers.js         Shared number/regex helpers
└── icon.png               48 / 128
```

### Auth flow
- Popup posts email + password to `${SUPABASE_URL}/auth/v1/token?grant_type=password` using the publishable key.
- Access + refresh tokens stored in `chrome.storage.local`.
- Background service worker refreshes the token before expiry.

### Sync flow
- Content script finds balance → `chrome.runtime.sendMessage({ type: "BALANCE_FOUND", program, balance })`.
- Popup reads via `chrome.storage.session` and shows "Marriott Bonvoy: 84,250 pts → Sync".
- On Sync: `PATCH /rest/v1/reward_accounts?user_id=eq.<uid>&program=eq.Marriott%20Bonvoy` with `{ balance }`. If no row exists yet, INSERT one with the matching `program_type`.

### Security
- Only the publishable anon key is bundled (safe to ship).
- Host permissions are limited to the three program domains — no broad `<all_urls>`.
- No DOM content is sent off-device; only the parsed integer balance + program name leave the browser.
- RLS on `reward_accounts` already restricts writes to `auth.uid() = user_id`, so a stolen token can only touch that user's rows.

## PointPilot web-app changes

1. **Download page** (`/extension` route): one-button download served from `/public/pointpilot-extension.zip`, with the 4-step "Load unpacked" install instructions.
2. **Header link**: small "Get extension" link in `SiteHeader` next to "Methodology".
3. **Account page**: a new "Last synced" timestamp column on each `reward_accounts` row + a small "via extension" badge when the row was updated by the extension.
4. **DB migration**: add `last_synced_at timestamptz` and `last_sync_source text` columns to `reward_accounts` (nullable, no RLS change needed).

## Build steps (in order)

1. Migration: add `last_synced_at`, `last_sync_source` to `reward_accounts`.
2. Create `extension/` folder with manifest, popup, background, content scripts, shared lib.
3. Wire content scripts to detect balances on the three domains with regex fallbacks.
4. Wire popup auth → Supabase REST → write to `reward_accounts`.
5. Package: `nix run nixpkgs#zip -- -r /dev-server/public/pointpilot-extension.zip .` from `extension/`.
6. Add `/extension` route in PointPilot with fetch+blob download button and install instructions.
7. Add "Get extension" link to `SiteHeader`.
8. Update `/account` to show "Last synced" + sync source.

## Out of scope for v1

- Award availability lookup (programs don't expose it on logged-in pages consistently).
- Auto-booking or deep-linking into award search.
- Hilton, Hyatt, United, American — easy to add later by dropping a new content script + host permission.
- Firefox build (manifest tweaks needed; Chrome/Edge/Brave/Arc/Opera all work from this build).

## Risks / honest caveats

- DOM selectors WILL break when programs redesign their sites. The regex fallback helps but isn't bulletproof — expect to ship occasional content-script updates.
- Some programs render balances inside Shadow DOM or behind additional clicks; v1 reads what's on the visible page after load + 2s delay.
- This is not an "official" integration — it's a personal-use convenience tool. We'll say so on the download page.

After you approve, I'll build the migration + extension + download page + zip in one pass.