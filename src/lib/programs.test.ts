import { describe, expect, it } from "vitest";
import {
  balanceFor,
  canonicalProgramName,
  freshnessLabel,
  isKnownBalance,
  normalizeProgramId,
  programNamesMatch,
} from "@/lib/programs";
import { calculateStrategies } from "@/lib/comparison-engine";

describe("program normalization", () => {
  it("maps aliases to stable ids and canonical names", () => {
    expect(normalizeProgramId("Hyatt")).toBe("world-of-hyatt");
    expect(canonicalProgramName("Citi ThankYou Rewards")).toBe("Citi ThankYou");
    expect(programNamesMatch("American AAdvantage", "aa")).toBe(true);
  });

  it("distinguishes an unknown balance from an explicit zero balance", () => {
    const accounts = [{ program: "World of Hyatt", balance: 0 }];
    expect(isKnownBalance(accounts, "Hyatt")).toBe(true);
    expect(balanceFor(accounts, "Hyatt")).toBe(0);
    expect(isKnownBalance([], "Hyatt")).toBe(false);
    expect(balanceFor([], "Hyatt")).toBeUndefined();
  });
});

describe("freshness labels", () => {
  const now = Date.parse("2026-08-23T12:00:00Z");
  it("labels missing and aging balances", () => {
    expect(freshnessLabel(null, now)).toBe("Balance not verified");
    expect(freshnessLabel("2026-08-23T08:00:00Z", now)).toBe("Verified today");
    expect(freshnessLabel("2026-08-01T12:00:00Z", now)).toBe("Verified this month");
    expect(freshnessLabel("2026-06-01T12:00:00Z", now)).toBe("Balance may be stale");
  });
});

describe("strategy feasibility", () => {
  const trip = {
    origin: "JFK",
    destination: "LIS",
    departDate: "2026-10-10",
    returnDate: "2026-10-17",
    travelers: 1,
    needsHotel: true,
    needsCar: false,
  };

  it("does not call an untracked program feasible", () => {
    const strategies = calculateStrategies(trip, []);
    expect(strategies.some((s) => s.feasible)).toBe(true); // cash is always feasible
    expect(strategies.filter((s) => s.totalPoints > 0).every((s) => !s.feasible)).toBe(true);
  });

  it("accepts a known zero balance only for zero-point strategies", () => {
    const strategies = calculateStrategies(trip, [
      { program: "World of Hyatt", program_type: "hotel", balance: 0 },
    ]);
    expect(strategies.find((s) => s.id === "all-cash")?.feasible).toBe(true);
    expect(strategies.find((s) => s.id === "all-points")?.feasible).toBe(false);
  });
});
