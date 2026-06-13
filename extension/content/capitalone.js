self.PP_DETECTORS.makeDetector("capitalone", "Capital One", {
  testIds: ['[data-testid*="miles-balance" i]', '[data-testid*="rewards-balance" i]'],
  ariaLabels: ['[aria-label*="miles balance" i]', '[aria-label*="rewards balance" i]', '[aria-label*="venture miles" i]'],
  jsonKey: /milesBalance|rewardsBalance|venturePoints|availableMiles/i,
  classMatches: ['[class*="milesBalance" i]', '[class*="rewardsBalance" i]'],
  labelRegex: /\b(miles?\s+balance|rewards?\s+balance|available\s+miles?|venture)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:miles?|points?)\b/i,
}, { min: 100, max: 50_000_000 });
