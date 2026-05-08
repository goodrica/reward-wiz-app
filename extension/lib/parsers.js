// Shared DOM helpers for content scripts.
// Exposed on `self` so non-module content scripts can use them.
//
// All `findBalanceBy*` helpers return either `null` or
//   { value: number, method: string, detail?: string }
// where `method` describes the intrinsic detection technique. Content scripts
// wrap each attempt with a stable `source` name and a `confidence` score
// (0..1) so the popup can show the user which strategy matched.
(function () {
  function parseNumber(text, { min = 100, max = 100_000_000 } = {}) {
    if (!text) return null;
    const cleaned = String(text).replace(/\u00a0/g, " ").trim();
    const match = cleaned.match(/(?<![\$£€¥])\b(\d{1,3}(?:[,\s]\d{3})+|\d{3,9})\b(?!\.\d)/);
    if (!match) return null;
    const n = parseInt(match[1].replace(/[,\s]/g, ""), 10);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return n;
  }

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
        if (n && isVisible(node.parentElement)) {
          return { value: n, method: "regex", detail: regex.source.slice(0, 60) };
        }
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
        const candidates = [
          ["aria-label", el.getAttribute?.("aria-label")],
          ["title", el.getAttribute?.("title")],
          ["data-value", el.getAttribute?.("data-value")],
          ["data-balance", el.getAttribute?.("data-balance")],
          ["text", el.textContent],
        ];
        for (const [attr, c] of candidates) {
          if (!c) continue;
          const n = parseNumber(c, opts);
          if (n) return { value: n, method: "selector", detail: `${sel} (${attr})` };
        }
      }
    }
    return null;
  }

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
      let cur = start;
      for (let i = 0; i < 4 && cur; i++) {
        const text = cur.textContent || "";
        const stripped = text.replace(labelRegex, " ");
        const n = parseNumber(stripped, opts);
        if (n) return { value: n, method: "label-proximity", detail: labelRegex.source.slice(0, 60) };
        const sib = cur.nextElementSibling;
        if (sib && isVisible(sib)) {
          const m = parseNumber(sib.textContent || "", opts);
          if (m) return { value: m, method: "label-proximity", detail: `sibling of "${labelRegex.source.slice(0, 40)}"` };
        }
        cur = cur.parentElement;
      }
    }
    return null;
  }

  function findBalanceInJsonBlocks(keyRegex, opts) {
    const blocks = document.querySelectorAll(
      'script[type="application/json"], script[type="application/ld+json"]'
    );
    for (const b of blocks) {
      const txt = b.textContent || "";
      if (txt.length < 5 || txt.length > 200_000) continue;
      if (!keyRegex.test(txt)) continue;
      try {
        const data = JSON.parse(txt);
        const found = walkJson(data, keyRegex, opts);
        if (found) return { value: found.value, method: "json", detail: `key=${found.key}` };
      } catch {
        const re = new RegExp(`"(${keyRegex.source})"\\s*:\\s*"?(\\d[\\d,]{2,})`, "i");
        const m = txt.match(re);
        if (m) {
          const n = parseNumber(m[2], opts);
          if (n) return { value: n, method: "json", detail: `key=${m[1]} (regex)` };
        }
      }
    }
    return null;
  }

  function walkJson(obj, keyRegex, opts, depth = 0) {
    if (!obj || depth > 8) return null;
    if (Array.isArray(obj)) {
      for (const v of obj) {
        const f = walkJson(v, keyRegex, opts, depth + 1);
        if (f) return f;
      }
      return null;
    }
    if (typeof obj !== "object") return null;
    for (const [k, v] of Object.entries(obj)) {
      if (keyRegex.test(k) && (typeof v === "number" || typeof v === "string")) {
        const n = parseNumber(String(v), opts);
        if (n) return { value: n, key: k };
      }
      if (v && typeof v === "object") {
        const f = walkJson(v, keyRegex, opts, depth + 1);
        if (f) return f;
      }
    }
    return null;
  }

  // Run a list of detection attempts in order and return the first hit
  // along with a stable source label + confidence score.
  // attempts: Array<{ source: string, confidence: number, run: () => Result|null }>
  function runDetection(attempts) {
    for (const a of attempts) {
      let r;
      try {
        r = a.run();
      } catch (e) {
        console.warn("[PointPilot] attempt threw", a.source, e);
        continue;
      }
      if (r && r.value) {
        return {
          value: r.value,
          source: a.source,
          confidence: a.confidence,
          method: r.method,
          detail: r.detail || "",
        };
      }
    }
    return null;
  }

  function reportBalance(program, hit) {
    if (!hit || !hit.value) return;
    chrome.runtime.sendMessage({
      type: "BALANCE_FOUND",
      program,
      balance: hit.value,
      source: hit.source,
      confidence: hit.confidence,
      method: hit.method,
      detail: hit.detail,
      url: location.href,
      detectedAt: Date.now(),
    });
  }

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
    runDetection,
    reportBalance,
    watchForBalance,
  };
})();
