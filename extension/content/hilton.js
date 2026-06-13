self.PP_DETECTORS.makeDetector("hilton", "Hilton", {
  testIds: ['[data-testid*="points-balance" i]', '[data-testid*="honors-points" i]'],
  ariaLabels: ['[aria-label*="honors points" i]', '[aria-label*="points balance" i]', '[aria-label*="available points" i]'],
  jsonKey: /honorsPoints|pointsBalance|availablePoints|totalPoints/i,
  classMatches: ['[class*="honorsPoints" i]', '[class*="pointsBalance" i]', '[class*="points-balance" i]'],
  labelRegex: /\b(honors\s+points?|points?\s+balance|available\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:Honors\s*)?points?\b/i,
}, { min: 100, max: 50_000_000 });
