self.PP_DETECTORS.makeDetector("delta", "Delta", {
  testIds: [
    '[data-testid="skymiles-balance"]',
    '[data-testid*="skymiles" i][data-testid*="balance" i]',
    '[data-testid*="miles-balance" i]',
    '[data-analytics*="miles-balance" i]',
  ],
  ariaLabels: [
    '[aria-label*="skymiles balance" i]',
    '[aria-label*="miles balance" i]',
    '[aria-label*="available miles" i]',
  ],
  jsonKey: /skyMilesBalance|milesBalance|availableMiles|loyaltyBalance/i,
  classMatches: [
    '[class*="skymilesBalance" i]',
    '[class*="skymiles-balance" i]',
    '[class*="milesBalance" i]',
    '[class*="miles-balance" i]',
  ],
  labelRegex: /\b(skymiles|miles?\s+balance|available\s+miles?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:SkyMiles|miles?|mi)\b/i,
}, { min: 100, max: 50_000_000 });
