// Service worker: receives BALANCE_FOUND messages from content scripts and
// stores the most recent reading per program in chrome.storage.session so the
// popup can read it.

const SESSION_KEY = "detected_balances";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "BALANCE_FOUND") return;
  (async () => {
    const store = (await chrome.storage.session.get(SESSION_KEY))[SESSION_KEY] || {};
    const prev = store[msg.program];
    // Update if value changed OR a higher-confidence source found the same value.
    const changed =
      !prev ||
      prev.balance !== msg.balance ||
      (msg.confidence || 0) > (prev.confidence || 0);
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
      try {
        await chrome.action.setBadgeText({ text: "•" });
        await chrome.action.setBadgeBackgroundColor({ color: "#d97706" });
      } catch {}
    }
    sendResponse({ ok: true });
  })();
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});
