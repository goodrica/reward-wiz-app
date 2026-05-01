(function () {
  const { findBalanceBySelector, findBalanceByRegex, reportBalance, watchForBalance } = self.PP_PARSERS;

  watchForBalance(() => {
    const balance =
      findBalanceBySelector([
        '[data-testid*="point" i]',
        '[class*="trueblue" i] [class*="point" i]',
        '[aria-label*="trueblue point" i]',
        '[aria-label*="point" i]',
      ]) ||
      findBalanceByRegex(/([\d,]{3,})\s*(?:TrueBlue\s*points?|points?|pts)\b/i);
    if (balance) reportBalance("jetblue", balance);
  });
})();
