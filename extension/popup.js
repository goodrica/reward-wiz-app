// Popup script. Auth + detected-balance display.
// Heavy lifting (auto-sync, refresh-all) is delegated to background.js.

const { PROGRAM_REGISTRY } = self.PP_CONFIG;
const APP_URL = "https://reward-wiz-app.lovable.app";
const SESSION_KEY = "detected_balances";
const STALE_MS = 30 * 24 * 60 * 60 * 1000;

async function loadDetected() {
  const { [SESSION_KEY]: store } = await chrome.storage.session.get(SESSION_KEY);
  return store || {};
}

async function loadSyncState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_SYNC_STATE" }, (r) => resolve(r || {}));
  });
}

const $ = (id) => document.getElementById(id);
function show(view) {
  $("signed-in").classList.toggle("hidden", view !== "in");
  $("signed-out").classList.toggle("hidden", view !== "out");
}

function fmtRelative(ts) {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function renderStale(syncState) {
  const ul = $("stale-list");
  ul.innerHTML = "";
  const now = Date.now();
  const stale = Object.entries(syncState).filter(([, v]) => v.lastSyncedAt && now - v.lastSyncedAt > STALE_MS);
  $("stale-section").classList.toggle("hidden", stale.length === 0);
  for (const [slug, v] of stale) {
    const meta = PROGRAM_REGISTRY[slug];
    if (!meta) continue;
    const li = document.createElement("li");
    li.className = "stale";
    const span = document.createElement("span");
    span.textContent = `${meta.program} · ${fmtRelative(v.lastSyncedAt)}`;
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = "Refresh";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (meta.balanceUrl) chrome.tabs.create({ url: meta.balanceUrl });
    });
    li.append(span, a);
    ul.append(li);
  }
}

function renderBalances(detected, syncState, syncingProgram) {
  const ul = $("balances");
  ul.innerHTML = "";
  const entries = Object.entries(detected);
  $("empty-state").classList.toggle("hidden", entries.length > 0);
  for (const [slug, info] of entries) {
    const meta = PROGRAM_REGISTRY[slug];
    if (!meta) continue;
    const synced = syncState[slug];
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.className = "meta";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = meta.program;

    const value = document.createElement("span");
    value.className = "value";
    value.textContent = `${info.balance.toLocaleString()} ${meta.program_type === "hotel" ? "pts" : meta.program_type === "airline" ? "miles" : "pts"}`;

    const conf = typeof info.confidence === "number" ? info.confidence : 0.5;
    const tier = conf >= 0.85 ? "high" : conf >= 0.6 ? "med" : "low";
    const tierLabel = tier === "high" ? "High" : tier === "med" ? "Needs review" : "Low";
    const badge = document.createElement("span");
    badge.className = `confidence confidence-${tier}`;
    badge.textContent = `${tierLabel} · ${Math.round(conf * 100)}%`;
    badge.title = `Matched via: ${info.source || "unknown"}${info.detail ? ` — ${info.detail}` : ""}`;

    const src = document.createElement("span");
    src.className = "source";
    if (synced && synced.lastSyncedAt && synced.lastValue === info.balance) {
      src.textContent = `Auto-synced ${fmtRelative(synced.lastSyncedAt)} · via ${info.source || "unknown"}`;
    } else if (synced && synced.lastError) {
      src.textContent = `Sync error: ${synced.lastError.slice(0, 60)}`;
    } else {
      src.textContent = `Detected via ${info.source || "unknown"}`;
    }

    left.append(name, value, badge, src);

    const btn = document.createElement("button");
    btn.className = "sync";
    const isHigh = tier === "high";
    const isSynced = synced && synced.lastValue === info.balance && !synced.lastError;
    btn.textContent = syncingProgram === slug ? "Syncing…" : (isSynced ? "Synced ✓" : isHigh ? "Re-sync" : "Sync");
    btn.disabled = syncingProgram === slug;
    btn.addEventListener("click", async () => {
      $("status").textContent = "";
      try {
        renderBalances(detected, syncState, slug);
        await self.PP_API.syncBalance(slug, { ...info, auto: false });
        $("status").textContent = `${meta.program} synced.`;
      } catch (e) {
        $("status").textContent = `Sync failed: ${e.message}`;
      } finally {
        const [d, s] = await Promise.all([loadDetected(), loadSyncState()]);
        renderBalances(d, s, null);
        renderStale(s);
      }
    });
    li.append(left, btn);
    ul.append(li);
  }
}

async function bootstrap() {
  const s = await self.PP_API.refreshIfNeeded();
  if (s) {
    show("in");
    $("signout-btn").classList.remove("hidden");
    $("user-email").textContent = s.user.email || "";
    const [detected, syncState] = await Promise.all([loadDetected(), loadSyncState()]);
    renderBalances(detected, syncState, null);
    renderStale(syncState);
  } else {
    show("out");
    $("signout-btn").classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    $("signin-error").textContent = "";
    try {
      await self.PP_API.signIn($("email").value.trim(), $("password").value);
      bootstrap();
    } catch (err) {
      $("signin-error").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
  $("signout-btn").addEventListener("click", async () => {
    await self.PP_API.clearSession();
    bootstrap();
  });
  $("refresh-all-btn").addEventListener("click", () => {
    $("status").textContent = "Opening your program pages in background tabs…";
    chrome.runtime.sendMessage({ type: "REFRESH_ALL" }, (r) => {
      if (r?.ok) {
        $("status").textContent = `Refreshing ${r.opened} programs. You can close this popup.`;
      } else {
        $("status").textContent = "Refresh failed.";
      }
    });
  });
  for (const id of ["open-app", "open-app-footer"]) {
    $(id).addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: APP_URL });
    });
  }
  bootstrap();
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if ((area === "session" && changes[SESSION_KEY]) || (area === "local" && changes.sync_state)) {
    const [d, s] = await Promise.all([loadDetected(), loadSyncState()]);
    renderBalances(d, s, null);
    renderStale(s);
  }
});
