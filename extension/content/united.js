self.PP_DETECTORS.makeDetector("united", "United", {
  testIds: ['[data-testid*="miles-balance" i]', '[data-testid*="mileageplus" i][data-testid*="balance" i]'],
  ariaLabels: ['[aria-label*="miles balance" i]', '[aria-label*="mileageplus" i]', '[aria-label*="available miles" i]'],
  jsonKey: /milesBalance|mileagePlusBalance|availableMiles|totalMiles/i,
  classMatches: ['[class*="milesBalance" i]', '[class*="miles-balance" i]', '[class*="mileagePlus" i]'],
  labelRegex: /\b(miles?\s+balance|available\s+miles?|mileageplus)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:MileagePlus\s*)?miles?\b/i,
}, { min: 100, max: 50_000_000 });
