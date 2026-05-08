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
        source: "Marriott data-testid",
        confidence: 0.95,
        run: () =>
          findBalanceBySelector(
            [
              '[data-testid="points-balance"]',
              '[data-testid*="points-balance" i]',
              '[data-testid*="member-points" i]',
              '[data-component*="PointsBalance" i]',
              '[data-component*="MemberPoints" i]',
              '[data-analytics*="points-balance" i]',
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
              '[aria-label*="point balance" i]',
              '[aria-label*="points balance" i]',
              '[aria-label*="available points" i]',
              '[aria-label*="bonvoy points" i]',
            ],
            opts
          ),
      },
      {
        source: "Hydrated JSON",
        confidence: 0.88,
        run: () => findBalanceInJsonBlocks(/availablePoints|pointsBalance|memberPoints|totalPoints/i, opts),
      },
      {
        source: "CSS class match",
        confidence: 0.7,
        run: () =>
          findBalanceBySelector(
            [
              '[class*="pointsBalance" i]',
              '[class*="points-balance" i]',
              '[class*="memberPoints" i]',
              '[class*="bonvoyPoints" i]',
            ],
            opts
          ),
      },
      {
        source: "Label proximity",
        confidence: 0.6,
        run: () => findBalanceNearLabel(/\b(available\s+points|points?\s+balance|bonvoy\s+points?)\b/i, opts),
      },
      {
        source: "Visible-text regex",
        confidence: 0.4,
        run: () => findBalanceByRegex(/([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:Bonvoy\s*)?points?\b/i, opts),
      },
    ]);

    if (hit) reportBalance("marriott", hit);
  });
})();
