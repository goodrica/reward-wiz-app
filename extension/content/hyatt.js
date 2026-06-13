self.PP_DETECTORS.makeDetector("hyatt", "Hyatt", {
  testIds: ['[data-testid*="points-balance" i]', '[data-testid*="member-points" i]'],
  ariaLabels: ['[aria-label*="points balance" i]', '[aria-label*="available points" i]', '[aria-label*="hyatt points" i]'],
  jsonKey: /pointsBalance|availablePoints|memberPoints|totalPoints/i,
  classMatches: ['[class*="pointsBalance" i]', '[class*="points-balance" i]', '[class*="memberPoints" i]'],
  labelRegex: /\b(points?\s+balance|available\s+points?|world\s+of\s+hyatt\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{3,9})\s*points?\b/i,
}, { min: 100, max: 20_000_000 });
