// Shared DOM helpers for content scripts.
// Exposed on `self` so non-module content scripts can use them.
(function () {
  function parseNumber(text) {
    if (!text) return null;
    const match = String(text).replace(/\u00a0/g, " ").match(/([\d][\d,\.\s]{2,})/);
    if (!match) return null;
    const cleaned = match[1].replace(/[,\s]/g, "");
    const n = parseInt(cleaned, 10);
    if (!Number.isFinite(n) || n <= 0 || n > 100_000_000) return null;
    return n;
  }

  // Walk visible text nodes and find one matching the regex; return parsed number.
  function findBalanceByRegex(regex) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || node.nodeValue.length > 200) return NodeFilter.FILTER_SKIP;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_SKIP;
        const tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const m = node.nodeValue.match(regex);
      if (m) {
        const n = parseNumber(m[1]);
        if (n) return n;
      }
    }
    return null;
  }

  function findBalanceBySelector(selectors) {
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const n = parseNumber(el.textContent);
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

  self.PP_PARSERS = { parseNumber, findBalanceByRegex, findBalanceBySelector, reportBalance, watchForBalance };
})();
