// Shared Supabase REST + session helpers.
// Safe to load in both popup (DOM) and background (service worker) contexts —
// only depends on `chrome.storage` and `fetch`. Reads SUPABASE_URL / KEY from
// self.PP_CONFIG which is loaded first.
(function () {
  const TOKEN_KEY = "pp_session";

  async function getSession() {
    const { [TOKEN_KEY]: s } = await chrome.storage.local.get(TOKEN_KEY);
    return s || null;
  }
  async function setSession(s) {
    await chrome.storage.local.set({ [TOKEN_KEY]: s });
  }
  async function clearSession() {
    await chrome.storage.local.remove(TOKEN_KEY);
  }

  async function signIn(email, password) {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = self.PP_CONFIG;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error_description || json.msg || "Sign-in failed");
    await setSession({
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (json.expires_in || 3600),
      user: json.user,
    });
    return json.user;
  }

  async function refreshIfNeeded() {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = self.PP_CONFIG;
    const s = await getSession();
    if (!s) return null;
    if (s.expires_at - 60 > Math.floor(Date.now() / 1000)) return s;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    if (!res.ok) {
      await clearSession();
      return null;
    }
    const json = await res.json();
    const next = {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (json.expires_in || 3600),
      user: json.user || s.user,
    };
    await setSession(next);
    return next;
  }

  async function pgFetch(path, init = {}) {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = self.PP_CONFIG;
    const s = await refreshIfNeeded();
    if (!s) throw new Error("Not signed in");
    const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${s.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  }

  // info: { balance, source, confidence, method, detail, url, auto }
  async function syncBalance(programSlug, info) {
    const { PROGRAM_REGISTRY } = self.PP_CONFIG;
    const meta = PROGRAM_REGISTRY[programSlug];
    if (!meta) throw new Error("Unknown program: " + programSlug);
    const s = await refreshIfNeeded();
    if (!s) throw new Error("Not signed in");
    const userId = s.user.id;
    const existing = await pgFetch(
      `/reward_accounts?user_id=eq.${userId}&program=eq.${encodeURIComponent(meta.program)}&select=id`
    );
    const payload = {
      balance: info.balance,
      last_synced_at: new Date().toISOString(),
      last_sync_source: info.auto ? "extension-auto" : (info.source ? `extension:${info.source}` : "extension"),
      last_sync_url: info.url || null,
      last_sync_method: info.method || null,
      last_sync_detail: info.detail || null,
      last_sync_confidence: typeof info.confidence === "number" ? info.confidence : null,
    };
    if (existing.length > 0) {
      await pgFetch(`/reward_accounts?id=eq.${existing[0].id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await pgFetch("/reward_accounts", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          program: meta.program,
          program_type: meta.program_type,
          ...payload,
        }),
      });
    }
  }

  self.PP_API = { getSession, setSession, clearSession, signIn, refreshIfNeeded, pgFetch, syncBalance };
})();
