self.PP_DETECTORS.makeDetector("bilt", "Bilt", {
  testIds: ['[data-testid*="points-balance" i]', '[data-testid*="bilt-points" i]'],
  ariaLabels: ['[aria-label*="bilt points" i]', '[aria-label*="points balance" i]'],
  jsonKey: /biltPoints|pointsBalance|availablePoints|rewardsBalance/i,
  classMatches: ['[class*="pointsBalance" i]', '[class*="biltPoints" i]'],
  labelRegex: /\b(bilt\s+points?|points?\s+balance|available\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{3,9})\s*points?\b/i,
}, { min: 100, max: 20_000_000 });
