// Service worker. Loads shared config + API helpers via importScripts so it
// can sync directly to the backend without going through the popup.
importScripts("lib/config.js", "lib/api.js");

const SESSION_KEY = "detected_balances"; // in-memory most-recent per program
const SYNC_STATE_KEY = "sync_state";     // persisted: last value/confidence we synced

const AUTO_THRESHOLD = 0.85;       // auto-sync immediately above this
const MEDIUM_THRESHOLD = 0.6;      // 0.6-0.85: auto-sync only if value matches prior high-confidence reading
const STALE_MS = 30 * 24 * 60 * 60 * 1000;

async function getSyncState() {
  const r = await chrome.storage.local.get(SYNC_STATE_KEY);
  return r[SYNC_STATE_KEY] || {};
}
async function setSyncState(state) {
  await chrome.storage.local.set({ [SYNC_STATE_KEY]: state });
}

async function refreshBadge() {
  try {
    const state = await getSyncState();
    const programs = Object.values(state);
    if (programs.length === 0) {
      await chrome.action.setBadgeText({ text: "" });
      return;
    }
    const now = Date.now();
    const anyFailed = programs.some((p) => p.lastError);
    const anyStale = programs.some((p) => !p.lastSyncedAt || now - p.lastSyncedAt > STALE_MS);
    if (anyFailed) {
      await chrome.action.setBadgeText({ text: "!" });
      await chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
    } else if (anyStale) {
      await chrome.action.setBadgeText({ text: "•" });
      await chrome.action.setBadgeBackgroundColor({ color: "#d97706" });
    } else {
      await chrome.action.setBadgeText({ text: "✓" });
      await chrome.action.setBadgeBackgroundColor({ color: "#16803c" });
    }
  } catch {}
}

async function maybeAutoSync(program, msg) {
  const state = await getSyncState();
  const prev = state[program];
  const conf = msg.confidence || 0;

  let shouldSync = false;
  if (conf >= AUTO_THRESHOLD) {
    shouldSync = true;
  } else if (conf >= MEDIUM_THRESHOLD && prev && prev.lastValue === msg.balance && (prev.lastConfidence || 0) >= AUTO_THRESHOLD) {
    // Medium-confidence reading that matches a value we previously verified at high confidence.
    shouldSync = true;
  }

  // De-dupe: don't re-sync the same value+confidence within 10 minutes.
  if (shouldSync && prev && prev.lastValue === msg.balance && (prev.lastConfidence || 0) >= conf && Date.now() - (prev.lastSyncedAt || 0) < 10 * 60 * 1000) {
    shouldSync = false;
  }

  if (!shouldSync) return { synced: false, reason: conf < MEDIUM_THRESHOLD ? "low-confidence" : "needs-review" };

  try {
    await self.PP_API.syncBalance(program, {
      balance: msg.balance,
      source: msg.source,
      confidence: msg.confidence,
      method: msg.method,
      detail: msg.detail,
      url: msg.url,
      auto: true,
    });
    state[program] = {
      lastValue: msg.balance,
      lastConfidence: conf,
      lastSyncedAt: Date.now(),
      lastUrl: msg.url || null,
      lastSource: msg.source || null,
      lastError: null,
    };
    await setSyncState(state);
    await refreshBadge();
    return { synced: true };
  } catch (e) {
    state[program] = {
      ...(prev || {}),
      lastError: String(e?.message || e),
      lastErrorAt: Date.now(),
    };
    await setSyncState(state);
    await refreshBadge();
    return { synced: false, error: String(e?.message || e) };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "BALANCE_FOUND") {
    (async () => {
      // Store the latest detection so the popup can display it.
      const store = (await chrome.storage.session.get(SESSION_KEY))[SESSION_KEY] || {};
      const prev = store[msg.program];
      const changed = !prev || prev.balance !== msg.balance || (msg.confidence || 0) > (prev.confidence || 0);
      if (changed) {
        store[msg.program] = {
          balance: msg.balance,
          url: msg.url,
          detectedAt: msg.detectedAt,
          source: msg.source || "unknown",
          confidence: typeof msg.confidence === "number" ? msg.confidence : 0.5,
          method: msg.method || "",
          detail: msg.detail || "",
        };
        await chrome.storage.session.set({ [SESSION_KEY]: store });
      }
      // Always try auto-sync (it has its own dedup).
      const result = await maybeAutoSync(msg.program, msg);
      sendResponse({ ok: true, ...result });
    })();
    return true;
  }

  if (msg?.type === "GET_SYNC_STATE") {
    (async () => sendResponse(await getSyncState()))();
    return true;
  }

  if (msg?.type === "REFRESH_ALL") {
    (async () => {
      const { PROGRAM_REGISTRY } = self.PP_CONFIG;
      const slugs = Object.keys(PROGRAM_REGISTRY);
      // Open each in a background tab; content scripts auto-detect on load.
      const opened = [];
      for (const slug of slugs) {
        const url = PROGRAM_REGISTRY[slug].balanceUrl;
        if (!url) continue;
        try {
          const tab = await chrome.tabs.create({ url, active: false });
          opened.push({ slug, tabId: tab.id });
        } catch (e) {
          console.warn("[PointPilot] failed to open tab for", slug, e);
        }
      }
      // Close each tab after 18s — enough time for SPA hydration + detection.
      setTimeout(async () => {
        for (const { tabId } of opened) {
          try { await chrome.tabs.remove(tabId); } catch {}
        }
      }, 18_000);
      sendResponse({ ok: true, opened: opened.length });
    })();
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});

// Refresh badge on startup.
refreshBadge();
