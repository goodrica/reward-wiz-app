self.PP_DETECTORS.makeDetector("ihg", "IHG", {
  testIds: ['[data-testid*="points-balance" i]', '[data-testid*="member-points" i]'],
  ariaLabels: ['[aria-label*="points balance" i]', '[aria-label*="ihg points" i]', '[aria-label*="available points" i]'],
  jsonKey: /pointsBalance|availablePoints|memberPoints|rewardsBalance/i,
  classMatches: ['[class*="pointsBalance" i]', '[class*="points-balance" i]', '[class*="memberPoints" i]'],
  labelRegex: /\b(points?\s+balance|available\s+points?|ihg\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{3,9})\s*points?\b/i,
}, { min: 100, max: 50_000_000 });
