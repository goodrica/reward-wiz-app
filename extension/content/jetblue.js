(function () {
  const {
    findBalanceBySelector,
    findBalanceByRegex,
    findBalanceNearLabel,
    findBalanceInJsonBlocks,
    reportBalance,
    watchForBalance,
  } = self.PP_PARSERS;

  // JetBlue TrueBlue balance shows up in:
  //  - signed-in header strip ("123,456 pts")
  //  - account dashboard hero
  //  - "TrueBlue points" card on the booking flow
  watchForBalance(() => {
    const opts = { min: 100, max: 20_000_000 };

    const balance =
      // 1) Specific TrueBlue data attributes / test ids.
      findBalanceBySelector(
        [
          '[data-testid="trueblue-points"]',
          '[data-testid*="trueblue-points" i]',
          '[data-testid*="points-balance" i]',
          '[data-qa*="points-balance" i]',
          '[data-analytics*="points" i][data-analytics*="balance" i]',
        ],
        opts
      ) ||
      // 2) Accessibility hooks.
      findBalanceBySelector(
        [
          '[aria-label*="trueblue point" i]',
          '[aria-label*="points balance" i]',
          '[aria-label*="point balance" i]',
        ],
        opts
      ) ||
      // 3) Class-name fallbacks.
      findBalanceBySelector(
        [
          '[class*="trueblue" i][class*="point" i]',
          '[class*="pointsBalance" i]',
          '[class*="points-balance" i]',
          '[class*="memberPoints" i]',
        ],
        opts
      ) ||
      // 4) Label proximity.
      findBalanceNearLabel(/\b(trueblue\s+points?|points?\s+balance|available\s+points?)\b/i, opts) ||
      // 5) Hydrated JSON.
      findBalanceInJsonBlocks(/pointsBalance|trueBluePoints|availablePoints|loyaltyBalance/i, opts) ||
      // 6) Visible-text fallback. Accept "pts" abbreviation since the header uses it.
      findBalanceByRegex(
        /([\d]{1,3}(?:,\d{3})+|\d{3,9})\s*(?:TrueBlue\s*)?(?:points?|pts)\b/i,
        opts
      );

    if (balance) reportBalance("jetblue", balance);
  });
})();
