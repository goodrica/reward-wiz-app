self.PP_DETECTORS.makeDetector("southwest", "Southwest", {
  testIds: ['[data-testid*="points-balance" i]', '[data-testid*="rapid-rewards" i][data-testid*="balance" i]'],
  ariaLabels: ['[aria-label*="rapid rewards" i]', '[aria-label*="points balance" i]', '[aria-label*="available points" i]'],
  jsonKey: /pointsBalance|rapidRewardsBalance|availablePoints|loyaltyPoints/i,
  classMatches: ['[class*="pointsBalance" i]', '[class*="points-balance" i]', '[class*="rapidRewards" i]'],
  labelRegex: /\b(rapid\s+rewards|points?\s+balance|available\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{3,9})\s*(?:Rapid\s*Rewards\s*)?(?:points?|pts)\b/i,
}, { min: 100, max: 20_000_000 });
