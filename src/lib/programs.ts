export type ProgramType = "airline" | "hotel" | "credit_card" | "telecom";

export interface ProgramDefinition {
  id: string;
  name: string;
  type: ProgramType;
  aliases: string[];
}

export const PROGRAMS: ProgramDefinition[] = [
  { id: "delta-skymiles", name: "Delta SkyMiles", type: "airline", aliases: ["delta", "skymiles"] },
  {
    id: "jetblue-trueblue",
    name: "JetBlue TrueBlue",
    type: "airline",
    aliases: ["jetblue", "trueblue"],
  },
  {
    id: "united-mileageplus",
    name: "United MileagePlus",
    type: "airline",
    aliases: ["united", "mileageplus"],
  },
  {
    id: "american-aadvantage",
    name: "American AAdvantage",
    type: "airline",
    aliases: ["american", "aadvantage", "aa"],
  },
  {
    id: "alaska-atmos",
    name: "Alaska Atmos Rewards",
    type: "airline",
    aliases: ["alaska", "alaska mileage plan", "atmos rewards"],
  },
  {
    id: "southwest-rapid-rewards",
    name: "Southwest Rapid Rewards",
    type: "airline",
    aliases: ["southwest", "rapid rewards"],
  },
  {
    id: "marriott-bonvoy",
    name: "Marriott Bonvoy",
    type: "hotel",
    aliases: ["marriott", "bonvoy"],
  },
  { id: "hilton-honors", name: "Hilton Honors", type: "hotel", aliases: ["hilton"] },
  { id: "world-of-hyatt", name: "World of Hyatt", type: "hotel", aliases: ["hyatt"] },
  {
    id: "ihg-one-rewards",
    name: "IHG One Rewards",
    type: "hotel",
    aliases: ["ihg", "ihg one", "priority club"],
  },
  { id: "wyndham-rewards", name: "Wyndham Rewards", type: "hotel", aliases: ["wyndham"] },
  { id: "choice-privileges", name: "Choice Privileges", type: "hotel", aliases: ["choice"] },
  {
    id: "chase-ultimate-rewards",
    name: "Chase Ultimate Rewards",
    type: "credit_card",
    aliases: ["chase", "ultimate rewards"],
  },
  {
    id: "amex-membership-rewards",
    name: "Amex Membership Rewards",
    type: "credit_card",
    aliases: ["amex", "membership rewards"],
  },
  {
    id: "capital-one-venture",
    name: "Capital One Venture",
    type: "credit_card",
    aliases: ["capital one", "venture"],
  },
  {
    id: "citi-thankyou",
    name: "Citi ThankYou",
    type: "credit_card",
    aliases: ["citi", "thankyou", "thank you", "citi thankyou rewards"],
  },
  { id: "bilt-rewards", name: "Bilt Rewards", type: "credit_card", aliases: ["bilt"] },
];

export function getProgram(value: string | undefined): ProgramDefinition | undefined {
  if (!value) return undefined;
  const needle = value.trim().toLowerCase();
  return PROGRAMS.find(
    (p) => p.id === needle || p.name.toLowerCase() === needle || p.aliases.includes(needle),
  );
}

export function normalizeProgramId(value: string): string {
  return (
    getProgram(value)?.id ??
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
  );
}

export function canonicalProgramName(value: string): string {
  return getProgram(value)?.name ?? value.trim();
}

export function programNamesMatch(a: string, b: string): boolean {
  return normalizeProgramId(a) === normalizeProgramId(b);
}

export function isKnownBalance(
  accounts: { program: string; balance: number }[],
  program: string,
): boolean {
  return accounts.some((a) => programNamesMatch(a.program, program));
}

export function balanceFor(
  accounts: { program: string; balance: number }[],
  program: string,
): number | undefined {
  const account = accounts.find((a) => programNamesMatch(a.program, program));
  return account ? account.balance : undefined;
}

export function freshnessLabel(lastSyncedAt?: string | null, now = Date.now()): string {
  if (!lastSyncedAt) return "Balance not verified";
  const age = now - new Date(lastSyncedAt).getTime();
  if (!Number.isFinite(age) || age < 0) return "Balance timestamp unavailable";
  if (age < 24 * 60 * 60 * 1000) return "Verified today";
  if (age < 7 * 24 * 60 * 60 * 1000) return "Verified this week";
  if (age < 30 * 24 * 60 * 60 * 1000) return "Verified this month";
  return "Balance may be stale";
}
