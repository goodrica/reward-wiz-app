/**
 * PointPilot comparison engine.
 *
 * Mock pricing engine that mimics how reward programs price the same trip very differently.
 * Calculates real cents-per-point value for each strategy so users can compare apples to apples.
 */

export type ProgramType = "airline" | "hotel" | "credit_card" | "telecom";

export interface RewardAccount {
  program: string;
  program_type: ProgramType;
  balance: number;
}

export interface TripInput {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  travelers: number;
  needsHotel: boolean;
  needsCar: boolean;
  preferredAirline?: string;
  preferredHotel?: string;
}

export interface StrategyLeg {
  type: "flight" | "hotel" | "car";
  provider: string;
  cashCost: number;
  pointsCost: number;
  pointsProgram?: string;
  fees: number;
}

export interface Strategy {
  id: string;
  title: string;
  subtitle: string;
  legs: StrategyLeg[];
  totalCash: number;
  totalPoints: number;
  pointsProgramBreakdown: Record<string, number>;
  centsPerPoint: number;
  feasible: boolean;
  feasibilityReason?: string;
  perks: string[];
  tradeoffs: string[];
  tags: string[];
}

// --- Mock pricing model ---------------------------------------------------

function hashSeed(...parts: string[]): number {
  const s = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

/**
 * Industry baseline valuations (cents per point).
 * Source: The Points Guy monthly valuations, May 2026
 * https://thepointsguy.com/loyalty-programs/monthly-valuations
 *
 * These are the published "fair value" benchmarks used across the
 * points-and-miles industry (TPG, NerdWallet, AwardWallet, Bankrate).
 * A redemption beats the benchmark when its actual CPP > baseCpp.
 */
const FLIGHT_PROGRAMS = [
  { name: "Delta SkyMiles", baseCpp: 1.2 },
  { name: "JetBlue TrueBlue", baseCpp: 1.35 },
  { name: "United MileagePlus", baseCpp: 1.35 },
  { name: "American AAdvantage", baseCpp: 1.6 },
  { name: "Alaska Atmos Rewards", baseCpp: 1.4 },
  { name: "Southwest Rapid Rewards", baseCpp: 1.25 },
];

const HOTEL_PROGRAMS = [
  { name: "Marriott Bonvoy", baseCpp: 0.8 },
  { name: "Hilton Honors", baseCpp: 0.4 },
  { name: "World of Hyatt", baseCpp: 1.65 },
  { name: "IHG One Rewards", baseCpp: 0.6 },
  { name: "Wyndham Rewards", baseCpp: 0.65 },
];

const PORTAL_PROGRAMS = [
  { name: "Chase Ultimate Rewards", baseCpp: 2.05 },
  { name: "Amex Membership Rewards", baseCpp: 2.0 },
  { name: "Capital One Venture", baseCpp: 1.85 },
  { name: "Citi ThankYou Rewards", baseCpp: 1.9 },
  { name: "Bilt Rewards", baseCpp: 2.2 },
];

/** Look up the published TPG benchmark for a program (used to flag good/bad redemptions). */
export function getBenchmarkCpp(program: string): number | undefined {
  const all = [...FLIGHT_PROGRAMS, ...HOTEL_PROGRAMS, ...PORTAL_PROGRAMS];
  return all.find((p) => p.name === program)?.baseCpp;
}

/**
 * Industry rule of thumb: a redemption is "good" when you get at least
 * the program's published baseline value per point. Below that, paying
 * cash and saving the points usually wins.
 */
export function compareToBenchmark(actualCpp: number, program?: string):
  | { status: "above" | "at" | "below"; benchmark: number; deltaPct: number }
  | null {
  if (!program) return null;
  const benchmark = getBenchmarkCpp(program);
  if (!benchmark || actualCpp <= 0) return null;
  const deltaPct = ((actualCpp - benchmark) / benchmark) * 100;
  const status = deltaPct >= 5 ? "above" : deltaPct <= -5 ? "below" : "at";
  return { status, benchmark, deltaPct };
}

function pickProgram<T extends { name: string }>(list: T[], owned: RewardAccount[], seed: number): T {
  const ownedNames = new Set(owned.map((a) => a.program));
  const ownedMatch = list.find((p) => ownedNames.has(p.name));
  if (ownedMatch) return ownedMatch;
  return list[Math.floor(seed * list.length)];
}

function flightCash(trip: TripInput): number {
  const seed = hashSeed(trip.origin, trip.destination, trip.departDate);
  const base = 220 + seed * 480;
  const rt = trip.returnDate ? 1.85 : 1;
  return Math.round(base * rt * trip.travelers);
}

function hotelCash(trip: TripInput): number {
  if (!trip.needsHotel || !trip.returnDate) return 0;
  const nights = Math.max(1, Math.round((new Date(trip.returnDate).getTime() - new Date(trip.departDate).getTime()) / 86400000));
  const seed = hashSeed(trip.destination, "hotel");
  const nightly = 140 + seed * 260;
  return Math.round(nightly * nights);
}

function carCash(trip: TripInput): number {
  if (!trip.needsCar || !trip.returnDate) return 0;
  const days = Math.max(1, Math.round((new Date(trip.returnDate).getTime() - new Date(trip.departDate).getTime()) / 86400000));
  const seed = hashSeed(trip.destination, "car");
  const daily = 45 + seed * 55;
  return Math.round(daily * days);
}

function pointsFor(cash: number, cpp: number): number {
  // points = cash * 100 / cpp(cents)
  return Math.round((cash * 100) / cpp);
}

function balanceOf(accounts: RewardAccount[], program: string): number {
  return accounts.find((a) => a.program === program)?.balance ?? 0;
}

// --- Strategy builders ----------------------------------------------------

export function calculateStrategies(trip: TripInput, accounts: RewardAccount[]): Strategy[] {
  const seed = hashSeed(trip.origin, trip.destination, trip.departDate);
  const flightCashCost = flightCash(trip);
  const hotelCashCost = hotelCash(trip);
  const carCashCost = carCash(trip);

  const flightProg = pickProgram(FLIGHT_PROGRAMS, accounts, seed);
  const hotelProg = pickProgram(HOTEL_PROGRAMS, accounts, hashSeed(trip.destination, "h"));
  const portalProg = pickProgram(PORTAL_PROGRAMS, accounts, hashSeed(trip.origin, "p"));

  const altFlight = FLIGHT_PROGRAMS.find((p) => p.name !== flightProg.name) ?? flightProg;
  const altHotel = HOTEL_PROGRAMS.find((p) => p.name !== hotelProg.name) ?? hotelProg;

  const flightPoints = pointsFor(flightCashCost, flightProg.baseCpp);
  const hotelPoints = trip.needsHotel ? pointsFor(hotelCashCost, hotelProg.baseCpp) : 0;
  const portalPoints = pointsFor(flightCashCost + hotelCashCost + carCashCost, portalProg.baseCpp);

  const totalCashAll = flightCashCost + hotelCashCost + carCashCost;

  const strategies: Strategy[] = [];

  // 1. All cash baseline
  strategies.push({
    id: "all-cash",
    title: "Pay all cash",
    subtitle: "Keep every point. Earn miles on the spend.",
    legs: [
      { type: "flight", provider: trip.preferredAirline || "Best fare airline", cashCost: flightCashCost, pointsCost: 0, fees: 0 },
      ...(trip.needsHotel ? [{ type: "hotel" as const, provider: trip.preferredHotel || "Best rate hotel", cashCost: hotelCashCost, pointsCost: 0, fees: 0 }] : []),
      ...(trip.needsCar ? [{ type: "car" as const, provider: "Standard rental", cashCost: carCashCost, pointsCost: 0, fees: 0 }] : []),
    ],
    totalCash: totalCashAll,
    totalPoints: 0,
    pointsProgramBreakdown: {},
    centsPerPoint: 0,
    feasible: true,
    perks: ["Earns elite-qualifying miles", "Full cancellation flexibility", "Bank credit-card rewards on the spend"],
    tradeoffs: ["Highest out-of-pocket", "No points used"],
    tags: ["baseline"],
  });

  // 2. All points (split bookings — best CPP per category)
  const allPointsLegs: StrategyLeg[] = [
    { type: "flight", provider: flightProg.name, cashCost: 11.20 * trip.travelers, pointsCost: flightPoints, pointsProgram: flightProg.name, fees: 11.20 * trip.travelers },
  ];
  if (trip.needsHotel) {
    allPointsLegs.push({ type: "hotel", provider: hotelProg.name, cashCost: 0, pointsCost: hotelPoints, pointsProgram: hotelProg.name, fees: 0 });
  }
  if (trip.needsCar) {
    // Cars rarely offer good point redemptions — fall back to cash
    allPointsLegs.push({ type: "car", provider: "Standard rental (cash)", cashCost: carCashCost, pointsCost: 0, fees: 0 });
  }
  const allPointsCash = allPointsLegs.reduce((s, l) => s + l.cashCost, 0);
  const allPointsBreakdown: Record<string, number> = {};
  allPointsLegs.forEach((l) => {
    if (l.pointsProgram && l.pointsCost) {
      allPointsBreakdown[l.pointsProgram] = (allPointsBreakdown[l.pointsProgram] ?? 0) + l.pointsCost;
    }
  });
  const allPointsValueSaved = totalCashAll - allPointsCash;
  const totalAllPoints = flightPoints + hotelPoints;
  const allPointsCpp = totalAllPoints > 0 ? (allPointsValueSaved * 100) / totalAllPoints : 0;
  const allPointsFeasible = Object.entries(allPointsBreakdown).every(
    ([prog, pts]) => balanceOf(accounts, prog) === 0 || balanceOf(accounts, prog) >= pts,
  );
  strategies.push({
    id: "all-points",
    title: "Maximize points (split booking)",
    subtitle: `Use ${flightProg.name} for the flight, ${trip.needsHotel ? hotelProg.name + " for the hotel" : "no hotel"}.`,
    legs: allPointsLegs,
    totalCash: Math.round(allPointsCash),
    totalPoints: totalAllPoints,
    pointsProgramBreakdown: allPointsBreakdown,
    centsPerPoint: allPointsCpp,
    feasible: allPointsFeasible,
    feasibilityReason: allPointsFeasible ? undefined : "Insufficient balance in one or more programs",
    perks: ["Best per-point value", "Award availability lets you skip peak pricing"],
    tradeoffs: ["Award seats limited — book early", "Mileage flights still owe taxes & fees"],
    tags: ["best-value"],
  });

  // 3. Credit-card portal (one-stop)
  const portalCash = totalCashAll * 0.05; // small surcharge
  const portalSavings = totalCashAll - portalCash;
  const portalCpp = portalPoints > 0 ? (portalSavings * 100) / portalPoints : 0;
  const portalFeasible = balanceOf(accounts, portalProg.name) === 0 || balanceOf(accounts, portalProg.name) >= portalPoints;
  strategies.push({
    id: "portal",
    title: `Book through ${portalProg.name}`,
    subtitle: "One-stop bundle through your credit-card travel portal.",
    legs: [
      { type: "flight", provider: `${portalProg.name} portal`, cashCost: flightCashCost * 0.05, pointsCost: Math.round(portalPoints * (flightCashCost / totalCashAll || 1)), pointsProgram: portalProg.name, fees: 0 },
      ...(trip.needsHotel ? [{ type: "hotel" as const, provider: `${portalProg.name} portal`, cashCost: hotelCashCost * 0.05, pointsCost: Math.round(portalPoints * (hotelCashCost / totalCashAll)), pointsProgram: portalProg.name, fees: 0 }] : []),
      ...(trip.needsCar ? [{ type: "car" as const, provider: `${portalProg.name} portal`, cashCost: carCashCost * 0.05, pointsCost: Math.round(portalPoints * (carCashCost / totalCashAll)), pointsProgram: portalProg.name, fees: 0 }] : []),
    ],
    totalCash: Math.round(portalCash),
    totalPoints: portalPoints,
    pointsProgramBreakdown: { [portalProg.name]: portalPoints },
    centsPerPoint: portalCpp,
    feasible: portalFeasible,
    feasibilityReason: portalFeasible ? undefined : `Need more ${portalProg.name} points`,
    perks: ["One booking, one confirmation", "Earn portal-tier bonuses"],
    tradeoffs: ["Lower per-point value than transfer partners", "No elite credit on the flight"],
    tags: ["bundled"],
  });

  // 4. Hybrid: points for flight, cash for hotel
  if (trip.needsHotel) {
    const hybridPoints = flightPoints;
    const hybridCash = 11.20 * trip.travelers + hotelCashCost + carCashCost;
    const hybridSavings = totalCashAll - hybridCash;
    const hybridCpp = (hybridSavings * 100) / hybridPoints;
    const hybridFeasible = balanceOf(accounts, flightProg.name) === 0 || balanceOf(accounts, flightProg.name) >= hybridPoints;
    strategies.push({
      id: "hybrid",
      title: "Points for flight, cash for hotel",
      subtitle: `Burn ${flightProg.name} miles on the flight; pay cash where points are weakest.`,
      legs: [
        { type: "flight", provider: flightProg.name, cashCost: 11.20 * trip.travelers, pointsCost: hybridPoints, pointsProgram: flightProg.name, fees: 11.20 * trip.travelers },
        { type: "hotel", provider: trip.preferredHotel || hotelProg.name, cashCost: hotelCashCost, pointsCost: 0, fees: 0 },
        ...(trip.needsCar ? [{ type: "car" as const, provider: "Standard rental", cashCost: carCashCost, pointsCost: 0, fees: 0 }] : []),
      ],
      totalCash: Math.round(hybridCash),
      totalPoints: hybridPoints,
      pointsProgramBreakdown: { [flightProg.name]: hybridPoints },
      centsPerPoint: hybridCpp,
      feasible: hybridFeasible,
      feasibilityReason: hybridFeasible ? undefined : `Need more ${flightProg.name} miles`,
      perks: ["Earn hotel elite nights & points", "Keeps hotel flexibility"],
      tradeoffs: ["Two separate bookings to manage"],
      tags: ["balanced"],
    });
  }

  // 5. Diversified split — different airline + hotel program than baseline (sometimes wins)
  if (altFlight !== flightProg) {
    const altPts = pointsFor(flightCashCost, altFlight.baseCpp);
    const altHotelPts = trip.needsHotel ? pointsFor(hotelCashCost, altHotel.baseCpp) : 0;
    const altCash = 11.20 * trip.travelers + carCashCost;
    const altSavings = totalCashAll - altCash;
    const totalAltPts = altPts + altHotelPts;
    const altCpp = totalAltPts > 0 ? (altSavings * 100) / totalAltPts : 0;
    const altBreakdown: Record<string, number> = { [altFlight.name]: altPts };
    if (altHotelPts) altBreakdown[altHotel.name] = altHotelPts;
    const altFeasible = Object.entries(altBreakdown).every(
      ([prog, pts]) => balanceOf(accounts, prog) === 0 || balanceOf(accounts, prog) >= pts,
    );
    strategies.push({
      id: "diversified",
      title: "Diversified split booking",
      subtitle: `Try ${altFlight.name}${trip.needsHotel ? ` + ${altHotel.name}` : ""} as an alternative ecosystem.`,
      legs: [
        { type: "flight", provider: altFlight.name, cashCost: 11.20 * trip.travelers, pointsCost: altPts, pointsProgram: altFlight.name, fees: 11.20 * trip.travelers },
        ...(trip.needsHotel ? [{ type: "hotel" as const, provider: altHotel.name, cashCost: 0, pointsCost: altHotelPts, pointsProgram: altHotel.name, fees: 0 }] : []),
        ...(trip.needsCar ? [{ type: "car" as const, provider: "Standard rental", cashCost: carCashCost, pointsCost: 0, fees: 0 }] : []),
      ],
      totalCash: Math.round(altCash),
      totalPoints: totalAltPts,
      pointsProgramBreakdown: altBreakdown,
      centsPerPoint: altCpp,
      feasible: altFeasible,
      feasibilityReason: altFeasible ? undefined : "Insufficient balance in one of these programs",
      perks: ["Diversifies your loyalty exposure", "Often beats your default ecosystem"],
      tradeoffs: ["Less status accrual in your main program"],
      tags: ["alternative"],
    });
  }

  return strategies;
}

export type RankMode = "value" | "cash";

export function rankStrategies(strategies: Strategy[], mode: RankMode): Strategy[] {
  const sorted = [...strategies].sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    if (mode === "value") {
      return b.centsPerPoint - a.centsPerPoint;
    }
    return a.totalCash - b.totalCash;
  });
  return sorted;
}

export function formatPoints(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
