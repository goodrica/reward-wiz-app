self.PP_DETECTORS.makeDetector("amex", "Amex MR", {
  testIds: [
    '[data-testid*="mr-points" i]',
    '[data-testid*="membership-rewards" i][data-testid*="balance" i]',
    '[data-testid*="rewards-balance" i]',
  ],
  ariaLabels: ['[aria-label*="membership rewards" i]', '[aria-label*="rewards balance" i]', '[aria-label*="available points" i]'],
  jsonKey: /membershipRewards|mrPoints|rewardsBalance|pointsBalance|availablePoints/i,
  classMatches: ['[class*="rewardsBalance" i]', '[class*="rewards-balance" i]', '[class*="mrPoints" i]'],
  labelRegex: /\b(membership\s+rewards|rewards?\s+balance|available\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:MR\s*)?points?\b/i,
}, { min: 100, max: 50_000_000 });
