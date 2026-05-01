// Shared DOM helpers for content scripts.
// Exposed on `self` so non-module content scripts can use them.
(function () {
  // Parse a balance-shaped number out of arbitrary text. Requires at least
  // 3 digits to avoid grabbing things like "1 night" or "$25". Rejects
  // currency-prefixed values ($1,234) and decimals (1,234.56) which are
  // almost always money, not points.
  function parseNumber(text, { min = 100, max = 100_000_000 } = {}) {
    if (!text) return null;
    const cleaned = String(text).replace(/\u00a0/g, " ").trim();
    // Find a digit run with optional thousand separators. No decimal part.
    const match = cleaned.match(/(?<![\$£€¥])\b(\d{1,3}(?:[,\s]\d{3})+|\d{3,9})\b(?!\.\d)/);
    if (!match) return null;
    const n = parseInt(match[1].replace(/[,\s]/g, ""), 10);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return n;
  }

  // True if the element (or an ancestor up to `depth`) is hidden.
  function isVisible(el, depth = 4) {
    let cur = el;
    for (let i = 0; i < depth && cur; i++) {
      const style = cur.ownerDocument?.defaultView?.getComputedStyle(cur);
      if (!style) return true;
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      cur = cur.parentElement;
    }
    return true;
  }

  // Walk visible text nodes and find one matching the regex; return parsed number.
  function findBalanceByRegex(regex, opts) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_SKIP;
        const len = node.nodeValue.length;
        if (len < 3 || len > 400) return NodeFilter.FILTER_SKIP;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_SKIP;
        const tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEMPLATE") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const m = node.nodeValue.match(regex);
      if (m) {
        const n = parseNumber(m[1] || m[0], opts);
        if (n && isVisible(node.parentElement)) return n;
      }
    }
    return null;
  }

  function findBalanceBySelector(selectors, opts) {
    for (const sel of selectors) {
      let els;
      try {
        els = document.querySelectorAll(sel);
      } catch {
        continue;
      }
      for (const el of els) {
        if (!isVisible(el)) continue;
        // Prefer aria-label / title / data-value for accessibility-tagged elements.
        const candidates = [
          el.getAttribute?.("aria-label"),
          el.getAttribute?.("title"),
          el.getAttribute?.("data-value"),
          el.getAttribute?.("data-balance"),
          el.textContent,
        ].filter(Boolean);
        for (const c of candidates) {
          const n = parseNumber(c, opts);
          if (n) return n;
        }
      }
    }
    return null;
  }

  // Find a label (e.g. "Points balance") then look for a number in the
  // same element, a sibling, or a nearby descendant. Handles layouts that
  // separate the label and the value into different nodes.
  function findBalanceNearLabel(labelRegex, opts) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || n.nodeValue.length > 120) return NodeFilter.FILTER_SKIP;
        if (!labelRegex.test(n.nodeValue)) return NodeFilter.FILTER_SKIP;
        const tag = n.parentElement?.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const start = node.parentElement;
      if (!start || !isVisible(start)) continue;
      // Climb up to 3 ancestors and search their text for a number.
      let cur = start;
      for (let i = 0; i < 4 && cur; i++) {
        const text = cur.textContent || "";
        // Strip the label itself so we don't re-match it.
        const stripped = text.replace(labelRegex, " ");
        const n = parseNumber(stripped, opts);
        if (n) return n;
        // Also try the next sibling.
        const sib = cur.nextElementSibling;
        if (sib && isVisible(sib)) {
          const m = parseNumber(sib.textContent || "", opts);
          if (m) return m;
        }
        cur = cur.parentElement;
      }
    }
    return null;
  }

  // Scan inline JSON-LD and other application/json blocks for likely balance keys.
  function findBalanceInJsonBlocks(keyRegex, opts) {
    const blocks = document.querySelectorAll(
      'script[type="application/json"], script[type="application/ld+json"]'
    );
    for (const b of blocks) {
      const txt = b.textContent || "";
      if (txt.length < 5 || txt.length > 200_000) continue;
      // Cheap pre-filter: must mention a relevant key.
      if (!keyRegex.test(txt)) continue;
      try {
        const data = JSON.parse(txt);
        const found = walkJson(data, keyRegex, opts);
        if (found) return found;
      } catch {
        // Fall back to a regex sweep over the raw JSON text.
        const re = new RegExp(`"(?:${keyRegex.source})"\\s*:\\s*"?(\\d[\\d,]{2,})`, "i");
        const m = txt.match(re);
        if (m) {
          const n = parseNumber(m[1], opts);
          if (n) return n;
        }
      }
    }
    return null;
  }

  function walkJson(obj, keyRegex, opts, depth = 0) {
    if (!obj || depth > 8) return null;
    if (Array.isArray(obj)) {
      for (const v of obj) {
        const n = walkJson(v, keyRegex, opts, depth + 1);
        if (n) return n;
      }
      return null;
    }
    if (typeof obj !== "object") return null;
    for (const [k, v] of Object.entries(obj)) {
      if (keyRegex.test(k) && (typeof v === "number" || typeof v === "string")) {
        const n = parseNumber(String(v), opts);
        if (n) return n;
      }
      if (v && typeof v === "object") {
        const n = walkJson(v, keyRegex, opts, depth + 1);
        if (n) return n;
      }
    }
    return null;
  }

  function reportBalance(program, balance) {
    if (!balance) return;
    chrome.runtime.sendMessage({
      type: "BALANCE_FOUND",
      program,
      balance,
      url: location.href,
      detectedAt: Date.now(),
    });
  }

  // Run `fn` now, then again on DOM mutations (debounced) for SPA pages.
  function watchForBalance(fn) {
    let last = 0;
    let timer = null;
    const run = () => {
      try {
        fn();
      } catch (e) {
        console.warn("[PointPilot] detector error", e);
      }
    };
    run();
    setTimeout(run, 1500);
    setTimeout(run, 4000);
    setTimeout(run, 8000);
    const observer = new MutationObserver(() => {
      const now = Date.now();
      if (now - last < 1000) {
        clearTimeout(timer);
        timer = setTimeout(run, 1000);
        return;
      }
      last = now;
      run();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  self.PP_PARSERS = {
    parseNumber,
    isVisible,
    findBalanceByRegex,
    findBalanceBySelector,
    findBalanceNearLabel,
    findBalanceInJsonBlocks,
    reportBalance,
    watchForBalance,
  };
})();
