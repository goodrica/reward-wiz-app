(function () {
  const { findBalanceBySelector, findBalanceByRegex, reportBalance, watchForBalance } = self.PP_PARSERS;

  watchForBalance(() => {
    const balance =
      findBalanceBySelector([
        '[data-testid*="point" i]',
        '[class*="points" i]',
        '[class*="Points"]',
        '[aria-label*="point" i]',
      ]) || findBalanceByRegex(/([\d,]{4,})\s*(?:points?|pts)\b/i);
    if (balance) reportBalance("marriott", balance);
  });
})();
