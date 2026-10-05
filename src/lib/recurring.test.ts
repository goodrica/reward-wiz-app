import { describe, expect, it } from "vitest";
import { detectRecurring, merchantKey, type Tx } from "@/lib/recurring";

const NOW = new Date("2026-10-05T12:00:00");

function monthly(name: string, amount: number, months: number, day = 5): Tx[] {
  const out: Tx[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, day);
    out.push({ date: d.toISOString().slice(0, 10), name, amount });
  }
  return out;
}

describe("merchantKey", () => {
  it("strips trailing reference codes and country suffixes", () => {
    expect(merchantKey("NETFLIX.COM 8665")).toBe("netflix.com");
    expect(merchantKey("AMZN MKTP US*2K7A")).toBe("amzn mktp");
    expect(merchantKey("Spotify USA")).toBe("spotify");
  });
});

describe("detectRecurring", () => {
  it("flags a monthly charge and estimates its cost", () => {
    const txs = monthly("NETFLIX.COM 8665", 15.49, 4);
    const found = detectRecurring(txs, 2, NOW);
    expect(found).toHaveLength(1);
    expect(found[0].cycle).toBe("monthly");
    expect(found[0].monthlyEstimate).toBe(15.49);
    expect(found[0].service).toBe("netflix");
  });

  it("resolves catalog services from statement names", () => {
    const txs = [...monthly("HULU 877-8244858", 9.99, 3), ...monthly("LOCAL GROCERY", 82.1, 3)];
    const found = detectRecurring(txs, 2, NOW);
    const hulu = found.find((f) => f.service === "hulu");
    const grocery = found.find((f) => f.name.includes("LOCAL"));
    expect(hulu).toBeDefined();
    expect(grocery?.service).toBeNull();
  });

  it("ignores one-off purchases", () => {
    const txs: Tx[] = [
      { date: "2026-09-01", name: "RANDOM SHOP", amount: 40 },
      { date: "2026-08-14", name: "OTHER SHOP", amount: 12 },
    ];
    expect(detectRecurring(txs, 2, NOW)).toHaveLength(0);
  });

  it("ignores charges that stopped months ago", () => {
    // four clean monthly hits, but the last one was 8 months back
    const txs: Tx[] = ["2025-11-05", "2025-12-05", "2026-01-05", "2026-02-05"].map((date) => ({
      date,
      name: "OLD GYM",
      amount: 30,
    }));
    expect(detectRecurring(txs, 2, NOW)).toHaveLength(0);
  });

  it("treats yearly charges as monthlyEstimate/12", () => {
    const txs: Tx[] = [
      { date: "2025-11-01", name: "AMZN PRIME*", amount: 139 },
      { date: "2026-10-01", name: "AMZN PRIME*", amount: 139 },
    ];
    const found = detectRecurring(txs, 2, NOW);
    expect(found).toHaveLength(1);
    expect(found[0].cycle).toBe("yearly");
    expect(found[0].monthlyEstimate).toBeCloseTo(139 / 12, 2);
  });
});
