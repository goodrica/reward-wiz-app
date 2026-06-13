self.PP_DETECTORS.makeDetector("aa", "American", {
  testIds: ['[data-testid*="miles-balance" i]', '[data-testid*="aadvantage" i][data-testid*="balance" i]'],
  ariaLabels: ['[aria-label*="aadvantage miles" i]', '[aria-label*="miles balance" i]', '[aria-label*="available miles" i]'],
  jsonKey: /milesBalance|aadvantageBalance|availableMiles|loyaltyMiles/i,
  classMatches: ['[class*="milesBalance" i]', '[class*="miles-balance" i]', '[class*="aadvantage" i]'],
  labelRegex: /\b(aadvantage\s+miles?|miles?\s+balance|available\s+miles?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:AAdvantage\s*)?miles?\b/i,
}, { min: 100, max: 50_000_000 });
