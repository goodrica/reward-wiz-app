self.PP_DETECTORS.makeDetector("alaska", "Alaska", {
  testIds: ['[data-testid*="miles-balance" i]', '[data-testid*="mileage-plan" i][data-testid*="balance" i]'],
  ariaLabels: ['[aria-label*="mileage plan" i]', '[aria-label*="miles balance" i]', '[aria-label*="available miles" i]'],
  jsonKey: /milesBalance|mileagePlanBalance|availableMiles|totalMiles/i,
  classMatches: ['[class*="milesBalance" i]', '[class*="miles-balance" i]', '[class*="mileagePlan" i]'],
  labelRegex: /\b(mileage\s+plan|miles?\s+balance|available\s+miles?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*miles?\b/i,
}, { min: 100, max: 20_000_000 });
