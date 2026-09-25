/**
 * Reward Wiz rules engine (Phase 1).
 *
 * Pure functions over the user's rewards profile. Given what a user pays for
 * (subscriptions), what they hold (credit cards, carrier plans), and the
 * curated catalog (aliases, bundle rules, card perks, offers), it surfaces:
 *
 *   - duplicate    two active subscriptions for the same underlying service
 *   - unused_perk  a paid service that's already included by a plan or card
 *   - new_offer    a catalog offer that matches something the user pays for
 *
 * Everything is deterministic and side-effect free so it can run in the
 * browser, in tests, and (later) in a background job.
 */

import {
  APPLE_ONE_COVERAGE,
  CARD_CATALOG,
  CARRIER_PLAN_CATALOG,
  OFFER_CATALOG,
  SERVICE_ALIASES,
  type CatalogCard,
  type CatalogCarrierPlan,
  type CatalogOffer,
} from "@/lib/rewards-catalog";

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";

export interface UserSubscription {
  id?: string;
  name: string;
  category?: string;
  cost: number;
  cycle: BillingCycle;
}

export interface UserCard {
  issuer: string;
  product: string;
}

export interface UserCarrierPlan {
  carrier: string;
  plan: string;
}

export type MatchType = "duplicate" | "unused_perk" | "new_offer";
export type MatchStatus = "open" | "done" | "dismissed";

export interface RewardMatch {
  /** Stable id so status toggles can persist across scans. */
  id: string;
  type: MatchType;
  title: string;
  detail: string;
  /** Estimated yearly savings if the user acts on this match. */
  savingsYearly: number;
  /** Source URLs the user should verify before acting. */
  sourceUrls: string[];
  /** Structured references for persistence (subscription ids, card, etc.). */
  refs: Record<string, unknown>;
}

export interface RewardsProfile {
  subscriptions: UserSubscription[];
  cards: UserCard[];
  carrierPlans: UserCarrierPlan[];
}

export interface ScanInput extends RewardsProfile {
  catalog?: {
    cards?: CatalogCard[];
    carrierPlans?: CatalogCarrierPlan[];
    offers?: CatalogOffer[];
  };
}

// --- Name matching --------------------------------------------------------

/** "HBO Max!" -> "hbo max". Lowercase, collapse whitespace, strip punctuation. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/&/g, " and ")
    .replace(/[.'’!_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map a free-text subscription name to its canonical service id, if known. */
export function resolveService(name: string): string | null {
  const norm = normalizeName(name);
  if (!norm) return null;
  for (const [service, aliases] of Object.entries(SERVICE_ALIASES)) {
    if (aliases.some((a) => norm === a || norm.includes(a))) return service;
  }
  return null;
}

/** True when two names clearly refer to the same underlying service. */
export function sameService(a: string, b: string): boolean {
  const sa = resolveService(a);
  const sb = resolveService(b);
  if (sa && sb) return sa === sb;
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  return na === nb || (na.length >= 4 && nb.includes(na)) || (nb.length >= 4 && na.includes(nb));
}

// --- Money ----------------------------------------------------------------

const CYCLES_PER_YEAR: Record<BillingCycle, number> = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export function yearlyCost(sub: UserSubscription): number {
  return Math.max(0, sub.cost) * CYCLES_PER_YEAR[sub.cycle];
}

export function monthlyCost(sub: UserSubscription): number {
  return yearlyCost(sub) / 12;
}

export function totalYearlySavings(matches: RewardMatch[]): number {
  return matches.reduce((sum, m) => sum + m.savingsYearly, 0);
}

// --- Rule 1: duplicate subscriptions ---------------------------------------

/**
 * Two active subscriptions that resolve to the same service. Recommends
 * keeping the cheaper one (or the one with the richer tier — Phase 1 just
 * keeps the cheaper; tier comparison arrives with offer metadata).
 */
export function detectDuplicates(subs: UserSubscription[]): RewardMatch[] {
  const matches: RewardMatch[] = [];
  const seen: { sub: UserSubscription; service: string }[] = [];

  for (const sub of subs) {
    const service = resolveService(sub.name) ?? normalizeName(sub.name);
    const prior = seen.find((s) => s.service === service);
    if (prior) {
      const keep = yearlyCost(prior.sub) <= yearlyCost(sub) ? prior.sub : sub;
      const drop = keep === prior.sub ? sub : prior.sub;
      const save = yearlyCost(drop);
      if (save <= 0) continue;
      matches.push({
        id: `dup:${service}`,
        type: "duplicate",
        title: `You're paying twice for ${drop.name}`,
        detail: `${prior.sub.name} and ${sub.name} are the same service. Cancel ${drop.name} ($${drop.cost}/${drop.cycle}) and keep ${keep.name} — same thing, one bill.`,
        savingsYearly: save,
        sourceUrls: [],
        refs: {
          service,
          keep: keep.name,
          drop: drop.name,
          subscriptionNames: [prior.sub.name, sub.name],
        },
      });
    } else {
      seen.push({ sub, service });
    }
  }
  return matches;
}

// --- Rule 2: perks you're already paying for -------------------------------

/** Card-perk hits: a held card covers a service the user pays for. */
export function detectCardPerks(subs: UserSubscription[], cards: UserCard[]): RewardMatch[] {
  const catalogCards = CARD_CATALOG;
  const matches: RewardMatch[] = [];

  for (const card of cards) {
    const catalogCard = catalogCards.find(
      (c) => c.issuer === card.issuer && c.product === card.product,
    );
    if (!catalogCard) continue;

    for (const perk of catalogCard.perks) {
      const sub = subs.find((s) => resolveService(s.name) === perk.service);
      if (!sub) continue;
      const capped = Math.min(perk.creditPerMonth, monthlyCost(sub));
      if (capped <= 0) continue;
      matches.push({
        id: `perk:card:${card.issuer}:${card.product}:${perk.service}`,
        type: "unused_perk",
        title: `${card.product} already covers ${sub.name}`,
        detail: `${perk.detail} You're paying $${sub.cost}/${sub.cycle} — enrolling means up to $${capped.toFixed(2)}/mo back.`,
        savingsYearly: Math.round(capped * 12 * 100) / 100,
        sourceUrls: [perk.sourceUrl],
        refs: {
          service: perk.service,
          card: `${card.issuer} ${card.product}`,
          subscription: sub.name,
        },
      });
    }
  }
  return matches;
}

/** Carrier-bundle hits: a plan you're on includes a service you pay for. */
export function detectCarrierBundles(
  subs: UserSubscription[],
  carrierPlans: UserCarrierPlan[],
): RewardMatch[] {
  const matches: RewardMatch[] = [];

  for (const held of carrierPlans) {
    const plan = CARRIER_PLAN_CATALOG.find(
      (p) => p.carrier === held.carrier && p.plan === held.plan,
    );
    if (!plan) continue;

    for (const bundle of plan.bundles) {
      const sub = subs.find((s) => resolveService(s.name) === bundle.service);
      if (!sub) continue;
      const save = Math.min(bundle.monthlyValue, monthlyCost(sub));
      if (save <= 0) continue;
      matches.push({
        id: `perk:carrier:${held.carrier}:${held.plan}:${bundle.service}`,
        type: "unused_perk",
        title: `${held.plan} already includes ${sub.name}`,
        detail: `Your ${held.carrier} ${held.plan} plan bundles ${bundle.includedTier} (~$${bundle.monthlyValue}/mo value). You also pay for ${sub.name} separately — link the accounts and cancel the standalone bill.`,
        savingsYearly: Math.round(save * 12 * 100) / 100,
        sourceUrls: [bundle.sourceUrl],
        refs: {
          service: bundle.service,
          carrierPlan: `${held.carrier} ${held.plan}`,
          subscription: sub.name,
        },
      });
    }
  }
  return matches;
}

/** Apple One is itself a bundle: flag every Apple service paid a la carte. */
export function detectBundleOverlap(subs: UserSubscription[]): RewardMatch[] {
  const hasAppleOne = subs.some((s) => resolveService(s.name) === "appleone");
  if (!hasAppleOne) return [];

  const matches: RewardMatch[] = [];
  for (const sub of subs) {
    const service = resolveService(sub.name);
    if (!service || !APPLE_ONE_COVERAGE.includes(service)) continue;
    const save = yearlyCost(sub);
    if (save <= 0) continue;
    matches.push({
      id: `perk:appleone:${service}`,
      type: "unused_perk",
      title: `Apple One already covers ${sub.name}`,
      detail: `Your Apple One bundle includes this. Cancel the standalone ${sub.name} plan and keep the bundle.`,
      savingsYearly: save,
      sourceUrls: [],
      refs: { service, subscription: sub.name },
    });
  }
  return matches;
}

// --- Rule 3: offers matching what you pay for ------------------------------

/**
 * Catalog offers for services the user already pays for. If the offer
 * requires a card the user doesn't hold, it's a softer signal — still shown,
 * but flagged in the refs so the UI can badge it "needs new card".
 */
export function detectNewOffers(
  subs: UserSubscription[],
  offers: CatalogOffer[],
  cards: UserCard[],
): RewardMatch[] {
  const matches: RewardMatch[] = [];

  for (const offer of offers) {
    const sub = subs.find((s) => resolveService(s.name) === offer.merchant);
    if (!sub) continue;
    const save = Math.min(offer.monthlyValue, monthlyCost(sub));
    if (save <= 0) continue;
    const hasCard = offer.requiresCardIssuer
      ? cards.some((c) => c.issuer === offer.requiresCardIssuer)
      : true;
    matches.push({
      id: `offer:${offer.merchant}:${offer.benefit}`,
      type: "new_offer",
      title: offer.benefit,
      detail: hasCard
        ? `You pay $${sub.cost}/${sub.cycle} for ${sub.name} and already hold the right card — activate the offer and save.`
        : `You pay $${sub.cost}/${sub.cycle} for ${sub.name}. This offer needs a ${offer.requiresCardIssuer} card — worth it only if you're already considering one.`,
      savingsYearly: Math.round(save * 12 * 100) / 100,
      sourceUrls: [offer.sourceUrl],
      refs: { merchant: offer.merchant, subscription: sub.name, hasRequiredCard: hasCard },
    });
  }
  return matches;
}

// --- Orchestration ----------------------------------------------------------

/** Run every rule and return de-duplicated matches, biggest savings first. */
export function runAllScans(input: ScanInput): RewardMatch[] {
  const offers = input.catalog?.offers ?? OFFER_CATALOG;
  const all = [
    ...detectDuplicates(input.subscriptions),
    ...detectCardPerks(input.subscriptions, input.cards),
    ...detectCarrierBundles(input.subscriptions, input.carrierPlans),
    ...detectBundleOverlap(input.subscriptions),
    ...detectNewOffers(input.subscriptions, offers, input.cards),
  ];
  // A card perk and a carrier bundle can both hit the same subscription —
  // surface both (user picks one), but never two identical match ids.
  const byId = new Map<string, RewardMatch>();
  for (const m of all) if (!byId.has(m.id)) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => b.savingsYearly - a.savingsYearly);
}

/** Split matches into the three buckets the dashboard renders. */
export function groupMatches(matches: RewardMatch[]): Record<MatchType, RewardMatch[]> {
  return {
    duplicate: matches.filter((m) => m.type === "duplicate"),
    unused_perk: matches.filter((m) => m.type === "unused_perk"),
    new_offer: matches.filter((m) => m.type === "new_offer"),
  };
}
