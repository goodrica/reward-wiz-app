(function () {
  const {
    findBalanceBySelector,
    findBalanceByRegex,
    findBalanceNearLabel,
    findBalanceInJsonBlocks,
    reportBalance,
    watchForBalance,
  } = self.PP_PARSERS;

  // Delta SkyMiles surfaces balance in:
  //  - top-right "Hi, Name" dropdown ("123,456 Miles")
  //  - SkyMiles dashboard hero card
  //  - profile / activity pages with "Miles balance"
  watchForBalance(() => {
    const opts = { min: 100, max: 50_000_000 };

    const balance =
      // 1) Delta-specific data attributes.
      findBalanceBySelector(
        [
          '[data-testid="skymiles-balance"]',
          '[data-testid*="skymiles" i][data-testid*="balance" i]',
          '[data-testid*="miles-balance" i]',
          '[data-analytics*="miles-balance" i]',
        ],
        opts
      ) ||
      // 2) Aria labels — Delta's nav uses these heavily.
      findBalanceBySelector(
        [
          '[aria-label*="skymiles balance" i]',
          '[aria-label*="miles balance" i]',
          '[aria-label*="available miles" i]',
        ],
        opts
      ) ||
      // 3) Class-based fallbacks for the dashboard hero.
      findBalanceBySelector(
        [
          '[class*="skymilesBalance" i]',
          '[class*="skymiles-balance" i]',
          '[class*="milesBalance" i]',
          '[class*="miles-balance" i]',
        ],
        opts
      ) ||
      // 4) Label proximity ("Miles balance", "SkyMiles", "Available miles").
      findBalanceNearLabel(/\b(skymiles|miles?\s+balance|available\s+miles?)\b/i, opts) ||
      // 5) Hydrated JSON.
      findBalanceInJsonBlocks(/skyMilesBalance|milesBalance|availableMiles|loyaltyBalance/i, opts) ||
      // 6) Visible text fallback. Require "miles" or "SkyMiles" word so we don't
      //    capture confirmation numbers, fare prices, or flight numbers.
      findBalanceByRegex(
        /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:SkyMiles|miles?|mi)\b/i,
        opts
      );

    if (balance) reportBalance("delta", balance);
  });
})();
