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
    const opts = { min: 100, max: 20_000_000 };

    const hit = runDetection([
      {
        source: "JetBlue data-testid",
        confidence: 0.95,
        run: () =>
          findBalanceBySelector(
            [
              '[data-testid="trueblue-points"]',
              '[data-testid*="trueblue-points" i]',
              '[data-testid*="points-balance" i]',
              '[data-qa*="points-balance" i]',
              '[data-analytics*="points" i][data-analytics*="balance" i]',
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
              '[aria-label*="trueblue point" i]',
              '[aria-label*="points balance" i]',
              '[aria-label*="point balance" i]',
            ],
            opts
          ),
      },
      {
        source: "Hydrated JSON",
        confidence: 0.88,
        run: () => findBalanceInJsonBlocks(/pointsBalance|trueBluePoints|availablePoints|loyaltyBalance/i, opts),
      },
      {
        source: "CSS class match",
        confidence: 0.7,
        run: () =>
          findBalanceBySelector(
            [
              '[class*="trueblue" i][class*="point" i]',
              '[class*="pointsBalance" i]',
              '[class*="points-balance" i]',
              '[class*="memberPoints" i]',
            ],
            opts
          ),
      },
      {
        source: "Label proximity",
        confidence: 0.6,
        run: () => findBalanceNearLabel(/\b(trueblue\s+points?|points?\s+balance|available\s+points?)\b/i, opts),
      },
      {
        source: "Visible-text regex",
        confidence: 0.4,
        run: () =>
          findBalanceByRegex(/([\d]{1,3}(?:,\d{3})+|\d{3,9})\s*(?:TrueBlue\s*)?(?:points?|pts)\b/i, opts),
      },
    ]);

    if (hit) reportBalance("jetblue", hit);
  });
})();
