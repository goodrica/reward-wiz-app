import { describe, expect, it } from "vitest";
import {
  detectCarrierBundles,
  detectDuplicates,
  monthlyCost,
  normalizeName,
  resolveService,
  runAllScans,
  sameService,
  yearlyCost,
  type RewardsProfile,
} from "@/lib/rewards-engine";

describe("name matching", () => {
  it("normalizes punctuation and case", () => {
    expect(normalizeName("HBO Max!")).toBe("hbo max");
    expect(normalizeName("  Disney+  ")).toBe("disney+");
  });

  it("resolves known aliases to canonical services", () => {
    expect(resolveService("Netflix Premium")).toBe("netflix");
    expect(resolveService("HBO Max")).toBe("max");
    expect(resolveService("Apple TV+")).toBe("appletv");
  });

  it("treats alias spellings as the same service", () => {
    expect(sameService("HBO Max", "Max")).toBe(true);
    expect(sameService("Netflix", "Hulu")).toBe(false);
  });
});

describe("money math", () => {
  it("converts cycles to yearly cost", () => {
    expect(yearlyCost({ name: "X", cost: 10, cycle: "monthly" })).toBe(120);
    expect(yearlyCost({ name: "X", cost: 100, cycle: "yearly" })).toBe(100);
    expect(monthlyCost({ name: "X", cost: 120, cycle: "yearly" })).toBe(10);
  });
});

describe("detectDuplicates", () => {
  it("flags two subscriptions for the same service", () => {
    const matches = detectDuplicates([
      { name: "Netflix", cost: 15.49, cycle: "monthly" },
      { name: "Netflix Premium", cost: 22.99, cycle: "monthly" },
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe("duplicate");
    // keeps the cheaper one, saves the pricier one
    expect(matches[0].savingsYearly).toBeCloseTo(22.99 * 12);
    expect(matches[0].refs.drop).toBe("Netflix Premium");
  });

  it("ignores distinct services", () => {
    expect(
      detectDuplicates([
        { name: "Netflix", cost: 15.49, cycle: "monthly" },
        { name: "Spotify", cost: 11.99, cycle: "monthly" },
      ]),
    ).toHaveLength(0);
  });
});

describe("detectCarrierBundles", () => {
  it("flags Netflix paid separately when T-Mobile plan includes it", () => {
    const matches = detectCarrierBundles(
      [{ name: "Netflix", cost: 15.49, cycle: "monthly" }],
      [{ carrier: "T-Mobile", plan: "Go5G Plus / Magenta MAX" }],
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe("unused_perk");
    expect(matches[0].savingsYearly).toBeCloseTo(15.49 * 12);
  });

  it("caps savings at what the user actually pays", () => {
    const matches = detectCarrierBundles(
      [{ name: "Netflix", cost: 6.99, cycle: "monthly" }],
      [{ carrier: "T-Mobile", plan: "Go5G Plus / Magenta MAX" }],
    );
    expect(matches[0].savingsYearly).toBeCloseTo(6.99 * 12);
  });

  it("does nothing when the plan is unknown", () => {
    expect(
      detectCarrierBundles(
        [{ name: "Netflix", cost: 15.49, cycle: "monthly" }],
        [{ carrier: "T-Mobile", plan: "Some Old Plan" }],
      ),
    ).toHaveLength(0);
  });
});

describe("runAllScans", () => {
  const profile: RewardsProfile = {
    subscriptions: [
      { name: "Netflix", cost: 15.49, cycle: "monthly" },
      { name: "HBO Max", cost: 16.99, cycle: "monthly" },
      { name: "Max", cost: 16.99, cycle: "monthly" },
      { name: "DashPass", cost: 9.99, cycle: "monthly" },
    ],
    cards: [{ issuer: "Chase", product: "Sapphire Reserve" }],
    carrierPlans: [{ carrier: "T-Mobile", plan: "Go5G Plus / Magenta MAX" }],
  };

  it("finds duplicates, carrier perks, and card perks in one pass", () => {
    const matches = runAllScans(profile);
    const types = new Set(matches.map((m) => m.type));
    expect(types.has("duplicate")).toBe(true);
    expect(types.has("unused_perk")).toBe(true);
    // DashPass covered by Sapphire Reserve
    expect(matches.some((m) => m.id === "perk:card:Chase:Sapphire Reserve:dashpass")).toBe(true);
  });

  it("sorts by savings, largest first, with unique ids", () => {
    const matches = runAllScans(profile);
    const ids = matches.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].savingsYearly).toBeGreaterThanOrEqual(matches[i].savingsYearly);
    }
  });
});
