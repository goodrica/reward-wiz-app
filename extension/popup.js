// Popup script. Handles auth against PointPilot's Supabase project, displays
// detected balances captured by content scripts, and pushes them into the
// reward_accounts table via PostgREST.

const { SUPABASE_URL, SUPABASE_ANON_KEY, PROGRAM_REGISTRY } = self.PP_CONFIG;
const APP_URL = "https://reward-wiz-app.lovable.app";
const SESSION_KEY = "detected_balances";
const TOKEN_KEY = "pp_session";

// ---------- token storage ----------
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

// ---------- auth ----------
async function signIn(email, password) {
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

// ---------- reward accounts API ----------
async function pgFetch(path, init = {}) {
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

async function syncBalance(programSlug, balance) {
  const meta = PROGRAM_REGISTRY[programSlug];
  if (!meta) throw new Error("Unknown program");
  const s = await refreshIfNeeded();
  const userId = s.user.id;
  const existing = await pgFetch(
    `/reward_accounts?user_id=eq.${userId}&program=eq.${encodeURIComponent(meta.program)}&select=id`
  );
  const payload = {
    balance,
    last_synced_at: new Date().toISOString(),
    last_sync_source: "extension",
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

// ---------- detected balances ----------
async function loadDetected() {
  const { [SESSION_KEY]: store } = await chrome.storage.session.get(SESSION_KEY);
  return store || {};
}

// ---------- UI ----------
const $ = (id) => document.getElementById(id);

function show(view) {
  $("signed-in").classList.toggle("hidden", view !== "in");
  $("signed-out").classList.toggle("hidden", view !== "out");
}

function renderBalances(detected, syncingProgram) {
  const ul = $("balances");
  ul.innerHTML = "";
  const entries = Object.entries(detected);
  $("empty-state").classList.toggle("hidden", entries.length > 0);
  for (const [slug, info] of entries) {
    const meta = PROGRAM_REGISTRY[slug];
    if (!meta) continue;
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.className = "meta";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = meta.program;
    const value = document.createElement("span");
    value.className = "value";
    value.textContent = `${info.balance.toLocaleString()} ${meta.program_type === "hotel" ? "pts" : "miles"}`;

    const conf = typeof info.confidence === "number" ? info.confidence : 0.5;
    const tier = conf >= 0.85 ? "high" : conf >= 0.6 ? "med" : "low";
    const tierLabel = tier === "high" ? "High" : tier === "med" ? "Medium" : "Low";
    const badge = document.createElement("span");
    badge.className = `confidence confidence-${tier}`;
    badge.textContent = `${tierLabel} · ${Math.round(conf * 100)}%`;
    badge.title = `Matched via: ${info.source || "unknown"}${info.detail ? ` — ${info.detail}` : ""}`;

    const src = document.createElement("span");
    src.className = "source";
    src.textContent = `via ${info.source || "unknown"}`;
    src.title = info.detail || "";

    left.append(name, value, badge, src);
    const btn = document.createElement("button");
    btn.className = "sync";
    btn.textContent = syncingProgram === slug ? "Syncing…" : "Sync";
    btn.disabled = syncingProgram === slug;
    btn.addEventListener("click", async () => {
      $("status").textContent = "";
      try {
        renderBalances(detected, slug);
        await syncBalance(slug, info.balance);
        $("status").textContent = `${meta.program} synced.`;
      } catch (e) {
        $("status").textContent = `Sync failed: ${e.message}`;
      } finally {
        renderBalances(await loadDetected(), null);
      }
    });
    li.append(left, btn);
    ul.append(li);
  }
}

async function bootstrap() {
  const s = await refreshIfNeeded();
  if (s) {
    show("in");
    $("signout-btn").classList.remove("hidden");
    $("user-email").textContent = s.user.email || "";
    renderBalances(await loadDetected(), null);
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
      await signIn($("email").value.trim(), $("password").value);
      bootstrap();
    } catch (err) {
      $("signin-error").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
  $("signout-btn").addEventListener("click", async () => {
    await clearSession();
    bootstrap();
  });
  for (const id of ["open-app", "open-app-footer"]) {
    $(id).addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: APP_URL });
    });
  }
  bootstrap();
});

// Live-update balances if a content script reports while popup is open.
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "session" && changes[SESSION_KEY]) {
    renderBalances(await loadDetected(), null);
  }
});
