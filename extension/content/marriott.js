self.PP_DETECTORS.makeDetector("marriott", "Marriott", {
  testIds: [
    '[data-testid="points-balance"]',
    '[data-testid*="points-balance" i]',
    '[data-testid*="member-points" i]',
    '[data-component*="PointsBalance" i]',
    '[data-component*="MemberPoints" i]',
    '[data-analytics*="points-balance" i]',
  ],
  ariaLabels: [
    '[aria-label*="point balance" i]',
    '[aria-label*="points balance" i]',
    '[aria-label*="available points" i]',
    '[aria-label*="bonvoy points" i]',
  ],
  jsonKey: /availablePoints|pointsBalance|memberPoints|totalPoints/i,
  classMatches: [
    '[class*="pointsBalance" i]',
    '[class*="points-balance" i]',
    '[class*="memberPoints" i]',
    '[class*="bonvoyPoints" i]',
  ],
  labelRegex: /\b(available\s+points|points?\s+balance|bonvoy\s+points?)\b/i,
  visibleRegex: /([\d]{1,3}(?:,\d{3})+|\d{4,9})\s*(?:Bonvoy\s*)?points?\b/i,
}, { min: 100, max: 50_000_000 });
