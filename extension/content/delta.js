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

  watchForBalance(() => {
    const opts = { min: 100, max: 50_000_000 };

    const hit = runDetection([
      {
        source: "Delta data-testid",
        confidence: 0.95,
        run: () =>
          findBalanceBySelector(
            [
              '[data-testid="skymiles-balance"]',
              '[data-testid*="skymiles" i][data-testid*="balance" i]',
              '[data-testid*="miles-balance" i]',
              '[data-analytics*="miles-balance" i]',
            ],
            opts
          ),
      },
      {
        source: "Aria label",
        confidence: 0.9,
        run: () =>
          findBalanceBySelector(
            [
              '[aria-label*="skymiles balance" i]',
              '[aria-label*="miles balance" i]',
              '[aria-label*="available miles" i]',
            ],
            opts
          ),
      },
      {
        source: "Hydrated JSON",
        confidence: 0.88,
        run: () => findBalanceInJsonBlocks(/skyMilesBalance|milesBalance|availableMiles|loyaltyBalance/i, opts),
      },
      {
        source: "CSS class match",
        confidence: 0.7,
        run: () =>
          findBalanceBySelector(
            [
              '[class*="skymilesBalance" i]',
              '[class*="skymiles-balance" i]',
              '[class*="milesBalance" i]',
              '[class*="miles-balance" i]',
            ],
            opts
          ),
      },
      {
        source: "Label proximity",
        confidence: 0.6,
        run: () => findBalanceNearLabel(/\b(skymiles|miles?\s+balance|available\s+miles?)\b/i, opts),
      },
      {
        source: "Visible-text regex",
        confidence: 0.4,
        run: () =>
          findBalanceByRegex(/([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:SkyMiles|miles?|mi)\b/i, opts),
      },
    ]);

    if (hit) reportBalance("delta", hit);
  });
})();
