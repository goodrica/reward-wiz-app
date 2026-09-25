/**
 * Reward Wiz curated catalog.
 *
 * Hand-curated bundle rules, card perks, and service aliases used by the
 * Phase 1 rules engine. Dollar values are ESTIMATES (list prices as of
 * Sep 2026) — each entry carries an official source URL so the user can
 * confirm before acting.
 *
 * Phase 3 replaces/augments this with live feeds; the engine only depends
 * on the exported shapes, not on where the data came from.
 */

export interface CatalogSubscription {
  name: string;
  category: string;
  typicalMonthlyCost: number;
}

export interface CardPerk {
  /** Canonical service this perk covers (must match an alias group key). */
  service: string;
  /** Maximum statement credit per month. */
  creditPerMonth: number;
  detail: string;
  sourceUrl: string;
}

export interface CatalogCard {
  issuer: string;
  product: string;
  annualFee: number;
  perks: CardPerk[];
}

export interface CarrierBundle {
  /** Canonical service included with the plan (alias group key). */
  service: string;
  includedTier: string;
  monthlyValue: number;
  sourceUrl: string;
}

export interface CatalogCarrierPlan {
  carrier: string;
  plan: string;
  bundles: CarrierBundle[];
}

export interface CatalogOffer {
  merchant: string;
  benefit: string;
  category: string;
  monthlyValue: number;
  /** Requirements the user must meet (card issuer, plan, etc.). */
  requiresCardIssuer?: string;
  sourceUrl: string;
}

/**
 * Alias groups: every known spelling of the same underlying service.
 * Keys are canonical ids; the engine matches user subscriptions against
 * these groups, so "HBO Max" and "Max" collide correctly.
 */
export const SERVICE_ALIASES: Record<string, string[]> = {
  netflix: ["netflix"],
  max: ["hbo max", "max", "hbomax"],
  disney: ["disney+", "disney plus", "disneyplus"],
  hulu: ["hulu"],
  appletv: ["apple tv+", "apple tv plus", "appletv+"],
  icloud: ["icloud+", "icloud", "icloud storage", "apple icloud"],
  applemusic: ["apple music"],
  appleone: ["apple one", "appleone"],
  spotify: ["spotify", "spotify premium"],
  youtube: ["youtube premium", "youtube music premium", "youtube music", "yt premium"],
  primevideo: ["amazon prime", "prime video", "amazon prime video", "prime"],
  peacock: ["peacock", "peacock premium"],
  paramount: ["paramount+", "paramount plus", "cbs all access"],
  espn: ["espn+", "espn plus"],
  walmartplus: ["walmart+", "walmart plus"],
  dashpass: ["dashpass", "doordash dashpass"],
  uberone: ["uber one", "uberone"],
  instacartplus: ["instacart+", "instacart plus"],
  audible: ["audible"],
  xboxgamepass: ["xbox game pass", "game pass"],
  playstationplus: ["playstation plus", "ps plus", "ps+"],
  nytdigital: ["new york times", "nyt", "nytimes"],
  calm: ["calm", "calm premium"],
  headspace: ["headspace"],
  adobecc: ["adobe creative cloud", "adobe cc"],
};

export const SUBSCRIPTION_CATALOG: CatalogSubscription[] = [
  { name: "Netflix", category: "streaming", typicalMonthlyCost: 15.49 },
  { name: "Max", category: "streaming", typicalMonthlyCost: 16.99 },
  { name: "Disney+", category: "streaming", typicalMonthlyCost: 9.99 },
  { name: "Hulu", category: "streaming", typicalMonthlyCost: 9.99 },
  { name: "Apple TV+", category: "streaming", typicalMonthlyCost: 9.99 },
  { name: "Peacock", category: "streaming", typicalMonthlyCost: 7.99 },
  { name: "Paramount+", category: "streaming", typicalMonthlyCost: 7.99 },
  { name: "ESPN+", category: "streaming", typicalMonthlyCost: 11.99 },
  { name: "Prime Video", category: "streaming", typicalMonthlyCost: 8.99 },
  { name: "Spotify Premium", category: "music", typicalMonthlyCost: 11.99 },
  { name: "Apple Music", category: "music", typicalMonthlyCost: 10.99 },
  { name: "YouTube Premium", category: "music", typicalMonthlyCost: 13.99 },
  { name: "iCloud+", category: "cloud", typicalMonthlyCost: 2.99 },
  { name: "Apple One", category: "bundle", typicalMonthlyCost: 19.95 },
  { name: "Audible", category: "audio", typicalMonthlyCost: 14.95 },
  { name: "Xbox Game Pass", category: "gaming", typicalMonthlyCost: 16.99 },
  { name: "PlayStation Plus", category: "gaming", typicalMonthlyCost: 9.99 },
  { name: "DashPass", category: "delivery", typicalMonthlyCost: 9.99 },
  { name: "Uber One", category: "delivery", typicalMonthlyCost: 9.99 },
  { name: "Instacart+", category: "delivery", typicalMonthlyCost: 9.99 },
  { name: "Walmart+", category: "delivery", typicalMonthlyCost: 12.95 },
  { name: "NYT Digital", category: "news", typicalMonthlyCost: 17 },
  { name: "Calm", category: "wellness", typicalMonthlyCost: 14.99 },
  { name: "Headspace", category: "wellness", typicalMonthlyCost: 12.99 },
  { name: "Adobe Creative Cloud", category: "software", typicalMonthlyCost: 59.99 },
];

export const CARD_CATALOG: CatalogCard[] = [
  {
    issuer: "American Express",
    product: "Platinum Card",
    annualFee: 695,
    perks: [
      {
        service: "disney",
        creditPerMonth: 20,
        detail:
          "Digital Entertainment Credit — up to $20/mo across Disney+, Disney Bundle, Hulu, ESPN+, Peacock and others. Enrollment required.",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/platinum-card/",
      },
      {
        service: "hulu",
        creditPerMonth: 20,
        detail: "Digital Entertainment Credit — up to $20/mo (shared cap with Disney+ / Peacock).",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/platinum-card/",
      },
      {
        service: "peacock",
        creditPerMonth: 20,
        detail: "Digital Entertainment Credit — up to $20/mo (shared cap with Disney+ / Hulu).",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/platinum-card/",
      },
      {
        service: "walmartplus",
        creditPerMonth: 12.95,
        detail:
          "Walmart+ Credit — full monthly membership cost covered (Walmart+ includes Paramount+).",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/platinum-card/",
      },
      {
        service: "uberone",
        creditPerMonth: 15,
        detail: "Uber Cash — $15/mo in Uber credits, usable toward Uber One membership.",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/platinum-card/",
      },
    ],
  },
  {
    issuer: "American Express",
    product: "Gold Card",
    annualFee: 325,
    perks: [
      {
        service: "dashpass",
        creditPerMonth: 10,
        detail:
          "Up to $10/mo in dining credits — Grubhub / Seamless cover most of DashPass's cost; plus complimentary DashPass via Grubhub+.",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/gold-card/",
      },
      {
        service: "uberone",
        creditPerMonth: 10,
        detail: "$10/mo in Uber Cash — stack toward Uber One.",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/gold-card/",
      },
    ],
  },
  {
    issuer: "American Express",
    product: "Blue Cash Preferred",
    annualFee: 95,
    perks: [
      {
        service: "disney",
        creditPerMonth: 7,
        detail:
          "$7/mo statement credit for The Disney Bundle (Disney+, Hulu, ESPN+). Enrollment required.",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/blue-cash-preferred-card/",
      },
      {
        service: "hulu",
        creditPerMonth: 7,
        detail: "$7/mo Disney Bundle credit (shared cap).",
        sourceUrl:
          "https://www.americanexpress.com/us/credit-cards/card-application/apply/prospect/terms/blue-cash-preferred-card/",
      },
    ],
  },
  {
    issuer: "Chase",
    product: "Sapphire Reserve",
    annualFee: 550,
    perks: [
      {
        service: "dashpass",
        creditPerMonth: 9.99,
        detail: "Complimentary DashPass — free while your Reserve is the payment method.",
        sourceUrl: "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve",
      },
      {
        service: "instacartplus",
        creditPerMonth: 10,
        detail: "Up to $10/mo in Instacart credits while Instacart+ membership is active.",
        sourceUrl: "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve",
      },
    ],
  },
  {
    issuer: "Chase",
    product: "Sapphire Preferred",
    annualFee: 95,
    perks: [
      {
        service: "dashpass",
        creditPerMonth: 9.99,
        detail:
          "Complimentary DashPass for a minimum of 12 months (then auto-renews at member rate).",
        sourceUrl: "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",
      },
      {
        service: "instacartplus",
        creditPerMonth: 10,
        detail: "Instacart+ free for 12 months plus up to $10/mo in Instacart credits.",
        sourceUrl: "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",
      },
    ],
  },
  {
    issuer: "Capital One",
    product: "Venture X",
    annualFee: 395,
    perks: [
      {
        service: "uberone",
        creditPerMonth: 10,
        detail: "Up to $10/mo in Uber/Uber Eats credits — covers Uber One.",
        sourceUrl: "https://www.capitalone.com/credit-cards/venture-x/",
      },
    ],
  },
];

export const CARRIER_PLAN_CATALOG: CatalogCarrierPlan[] = [
  {
    carrier: "T-Mobile",
    plan: "Go5G Plus / Magenta MAX",
    bundles: [
      {
        service: "netflix",
        includedTier: "Netflix Standard (2 screens)",
        monthlyValue: 15.49,
        sourceUrl: "https://www.t-mobile.com/support/plans-features/t-mobile-netflix-on-us",
      },
      {
        service: "appletv",
        includedTier: "Apple TV+ (ongoing)",
        monthlyValue: 9.99,
        sourceUrl: "https://www.t-mobile.com/support/plans-features/apple-tv-plus-on-us",
      },
      {
        service: "hulu",
        includedTier: "Hulu (With Ads) — select plans",
        monthlyValue: 9.99,
        sourceUrl: "https://www.t-mobile.com/support/plans-features/hulu-on-us",
      },
    ],
  },
  {
    carrier: "T-Mobile",
    plan: "Magenta / Go5G",
    bundles: [
      {
        service: "netflix",
        includedTier: "Netflix Standard with Ads",
        monthlyValue: 7.99,
        sourceUrl: "https://www.t-mobile.com/support/plans-features/t-mobile-netflix-on-us",
      },
      {
        service: "appletv",
        includedTier: "Apple TV+ (ongoing)",
        monthlyValue: 9.99,
        sourceUrl: "https://www.t-mobile.com/support/plans-features/apple-tv-plus-on-us",
      },
    ],
  },
  {
    carrier: "Verizon",
    plan: "myPlan Unlimited Ultimate",
    bundles: [
      {
        service: "walmartplus",
        includedTier: "Walmart+ included (Paramount+ bundled)",
        monthlyValue: 12.95,
        sourceUrl: "https://www.verizon.com/solutions-and-services/verizon-walmart-plus/",
      },
    ],
  },
  {
    carrier: "Verizon",
    plan: "myPlan (any unlimited)",
    bundles: [
      {
        service: "disney",
        includedTier: "Disney Bundle (Disney+, Hulu, ESPN+ with ads) — $10/mo perk add-on",
        monthlyValue: 14.99,
        sourceUrl: "https://www.verizon.com/solutions-and-services/disney-bundle/",
      },
      {
        service: "hulu",
        includedTier: "Included via the Disney Bundle perk",
        monthlyValue: 9.99,
        sourceUrl: "https://www.verizon.com/solutions-and-services/disney-bundle/",
      },
    ],
  },
];

export const OFFER_CATALOG: CatalogOffer[] = [
  {
    merchant: "hulu",
    benefit: "Amex Offer: $5 back per month on Hulu",
    category: "streaming",
    monthlyValue: 5,
    requiresCardIssuer: "American Express",
    sourceUrl: "https://www.americanexpress.com/en-us/benefits/offers/",
  },
  {
    merchant: "paramount",
    benefit: "Walmart+ includes Paramount+ at no extra cost",
    category: "streaming",
    monthlyValue: 7.99,
    sourceUrl: "https://www.walmart.com/plus",
  },
];

/** Services a single Apple One bundle already covers (family tier). */
export const APPLE_ONE_COVERAGE = ["applemusic", "appletv", "icloud"];
