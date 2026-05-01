(function () {
  const { findBalanceBySelector, findBalanceByRegex, reportBalance, watchForBalance } = self.PP_PARSERS;

  watchForBalance(() => {
    const balance =
      findBalanceBySelector([
        '[data-testid*="mile" i]',
        '[class*="skymile" i]',
        '[class*="miles" i]',
        '[aria-label*="skymile" i]',
        '[aria-label*="mile" i]',
      ]) || findBalanceByRegex(/([\d,]{4,})\s*(?:SkyMiles|miles?|mi)\b/i);
    if (balance) reportBalance("delta", balance);
  });
})();
