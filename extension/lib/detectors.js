// Detector factory — collapses the per-program boilerplate into one config object.
// Each program file calls `makeDetector("slug", "Brand Label", { ...config }, opts)`
// and gets the full prioritized attempt chain for free.
(function () {
  const {
    findBalanceBySelector,
    findBalanceByRegex,
    findBalanceNearLabel,
    findBalanceInJsonBlocks,
    runDetection,
    reportBalance,
    watchForBalance,
  } = self.PP_PARSERS;

  function makeDetector(slug, brand, cfg, opts = { min: 100, max: 100_000_000 }) {
    const attempts = [];
    if (cfg.testIds?.length) {
      attempts.push({
        source: `${brand} data-testid`,
        confidence: 0.95,
        run: () => findBalanceBySelector(cfg.testIds, opts),
      });
    }
    if (cfg.ariaLabels?.length) {
      attempts.push({
        source: "Aria label",
        confidence: 0.9,
        run: () => findBalanceBySelector(cfg.ariaLabels, opts),
      });
    }
    if (cfg.jsonKey) {
      attempts.push({
        source: "Hydrated JSON",
        confidence: 0.88,
        run: () => findBalanceInJsonBlocks(cfg.jsonKey, opts),
      });
    }
    if (cfg.classMatches?.length) {
      attempts.push({
        source: "CSS class match",
        confidence: 0.7,
        run: () => findBalanceBySelector(cfg.classMatches, opts),
      });
    }
    if (cfg.labelRegex) {
      attempts.push({
        source: "Label proximity",
        confidence: 0.6,
        run: () => findBalanceNearLabel(cfg.labelRegex, opts),
      });
    }
    if (cfg.visibleRegex) {
      attempts.push({
        source: "Visible-text regex",
        confidence: 0.4,
        run: () => findBalanceByRegex(cfg.visibleRegex, opts),
      });
    }

    watchForBalance(() => {
      const hit = runDetection(attempts);
      if (hit) reportBalance(slug, hit);
    });
  }

  self.PP_DETECTORS = { makeDetector };
})();
