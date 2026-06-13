self.PP_DETECTORS.makeDetector("citi", "Citi TY", {
  testIds: ['[data-testid*="thankyou-points" i]', '[data-testid*="ty-points" i]', '[data-testid*="rewards-balance" i]'],
  ariaLabels: ['[aria-label*="thankyou points" i]', '[aria-label*="rewards balance" i]'],
  jsonKey: /thankYouPoints|tyPoints|rewardsBalance|pointsBalance/i,
  classMatches: ['[class*="thankYouPoints" i]', '[class*="rewardsBalance" i]', '[class*="tyPoints" i]'],
  labelRegex: /\b(thankyou\s+points?|rewards?\s+balance|points?\s+balance)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:ThankYou\s*)?points?\b/i,
}, { min: 100, max: 50_000_000 });
