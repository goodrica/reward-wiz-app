self.PP_DETECTORS.makeDetector("chase", "Chase UR", {
  testIds: [
    '[data-testid*="ur-points" i]',
    '[data-testid*="ultimate-rewards" i][data-testid*="balance" i]',
    '[data-testid*="rewards-balance" i]',
  ],
  ariaLabels: ['[aria-label*="ultimate rewards" i]', '[aria-label*="rewards balance" i]', '[aria-label*="available points" i]'],
  jsonKey: /ultimateRewards|urPoints|rewardsBalance|pointsBalance|availablePoints/i,
  classMatches: ['[class*="rewardsBalance" i]', '[class*="rewards-balance" i]', '[class*="urPoints" i]'],
  labelRegex: /\b(ultimate\s+rewards|rewards?\s+balance|available\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:UR\s*)?points?\b/i,
}, { min: 100, max: 50_000_000 });
