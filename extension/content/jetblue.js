self.PP_DETECTORS.makeDetector("jetblue", "JetBlue", {
  testIds: [
    '[data-testid="trueblue-points"]',
    '[data-testid*="trueblue-points" i]',
    '[data-testid*="points-balance" i]',
    '[data-qa*="points-balance" i]',
    '[data-analytics*="points" i][data-analytics*="balance" i]',
  ],
  ariaLabels: [
    '[aria-label*="trueblue point" i]',
    '[aria-label*="points balance" i]',
    '[aria-label*="point balance" i]',
  ],
  jsonKey: /pointsBalance|trueBluePoints|availablePoints|loyaltyBalance/i,
  classMatches: [
    '[class*="trueblue" i][class*="point" i]',
    '[class*="pointsBalance" i]',
    '[class*="points-balance" i]',
    '[class*="memberPoints" i]',
  ],
  labelRegex: /\b(trueblue\s+points?|points?\s+balance|available\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{3,9})\s*(?:TrueBlue\s*)?(?:points?|pts)\b/i,
}, { min: 100, max: 20_000_000 });
