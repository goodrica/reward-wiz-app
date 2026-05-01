(function () {
  const {
    findBalanceBySelector,
    findBalanceByRegex,
    findBalanceNearLabel,
    findBalanceInJsonBlocks,
    reportBalance,
    watchForBalance,
  } = self.PP_PARSERS;

  // Marriott Bonvoy lays out the balance differently across:
  //  - account dashboard (large hero number)
  //  - header / member dropdown (compact, often inside <button>)
  //  - activity & statements pages (table cell with "Available points")
  watchForBalance(() => {
    const opts = { min: 100, max: 50_000_000 };

    const balance =
      // 1) Specific Marriott data-testid / data-component attributes.
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
      ) ||
      // 2) Accessibility attributes on header/dropdown widgets.
      findBalanceBySelector(
        [
          '[aria-label*="point balance" i]',
          '[aria-label*="points balance" i]',
          '[aria-label*="available points" i]',
          '[aria-label*="bonvoy points" i]',
        ],
        opts
      ) ||
      // 3) Class-based fallbacks for the dashboard hero number.
      findBalanceBySelector(
        [
          '[class*="pointsBalance" i]',
          '[class*="points-balance" i]',
          '[class*="memberPoints" i]',
          '[class*="bonvoyPoints" i]',
        ],
        opts
      ) ||
      // 4) Label proximity: "Available points", "Points balance", "Bonvoy points".
      findBalanceNearLabel(/\b(available\s+points|points?\s+balance|bonvoy\s+points?)\b/i, opts) ||
      // 5) JSON blobs the SPA hydrates from.
      findBalanceInJsonBlocks(/availablePoints|pointsBalance|memberPoints|totalPoints/i, opts) ||
      // 6) Last-resort visible text scan. Require the word "points" to avoid
      //    grabbing room rates or confirmation numbers.
      findBalanceByRegex(/([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:Bonvoy\s*)?points?\b/i, opts);

    if (balance) reportBalance("marriott", balance);
  });
})();
