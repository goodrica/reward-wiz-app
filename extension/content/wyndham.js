self.PP_DETECTORS.makeDetector("wyndham", "Wyndham", {
  testIds: ['[data-testid*="points-balance" i]', '[data-testid*="member-points" i]'],
  ariaLabels: ['[aria-label*="points balance" i]', '[aria-label*="wyndham points" i]'],
  jsonKey: /pointsBalance|availablePoints|memberPoints|wyndhamPoints/i,
  classMatches: ['[class*="pointsBalance" i]', '[class*="points-balance" i]'],
  labelRegex: /\b(points?\s+balance|available\s+points?|wyndham\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{3,9})\s*points?\b/i,
}, { min: 100, max: 20_000_000 });
