/**
 * Recurring-charge detection over Plaid transaction history.
 *
 * The payoff loop of the app: pull transactions -> find what you pay for
 * every month -> hand those to the rewards engine, which already knows
 * which of them are free via T-Mobile, covered by a card credit, or
 * duplicate.
 */

import { resolveService, type BillingCycle } from "@/lib/rewards-engine";

export interface Tx {
  date: string; // YYYY-MM-DD
  name: string;
  amount: number;
}

export interface RecurringCharge {
  /** Merchant name as it appears on the statement. */
  name: string;
  /** Canonical service id when the catalog recognizes it. */
  service: string | null;
  cycle: BillingCycle;
  monthlyEstimate: number;
  occurrences: number;
  firstDate: string;
  lastDate: string;
}

/** "NETFLIX.COM 8665" / "AMZN MKTP US*2K7A" -> "netflix.com" / "amzn mktp us" */
export function merchantKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[*#][a-z0-9]+$/i, "")
    .replace(/\s+\S*\d\S*$/, "") // trailing reference/phone token containing digits
    .replace(/\s+(us|usa|ca|uk)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

const DAY = 24 * 60 * 60 * 1000;

function gaps(dates: Date[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < dates.length; i++)
    out.push((dates[i].getTime() - dates[i - 1].getTime()) / DAY);
  return out;
}

function median(ns: number[]): number {
  const s = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Find recurring charges. A merchant qualifies when it has at least
 * `minOccurrences` charges whose median inter-charge gap looks monthly
 * (25–35 days) or yearly (330–380 days). Small sample sizes are expected —
 * 6 months of history yields at most 6 monthly hits.
 */
export function detectRecurring(
  txs: Tx[],
  minOccurrences = 2,
  now: Date = new Date(),
): RecurringCharge[] {
  const groups = new Map<string, Tx[]>();
  for (const t of txs) {
    if (t.amount <= 0) continue; // ignore refunds/credits for detection
    const key = merchantKey(t.name);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const out: RecurringCharge[] = [];
  for (const [key, list] of groups) {
    if (list.length < minOccurrences) continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const dates = sorted.map((t) => new Date(`${t.date}T12:00:00`));
    const medGap = median(gaps(dates));

    let cycle: BillingCycle | null = null;
    if (medGap >= 25 && medGap <= 35) cycle = "monthly";
    else if (medGap >= 330 && medGap <= 380) cycle = "yearly";
    if (!cycle) continue;

    // Skip charges that stopped — a recurring charge is only useful if the
    // last one is reasonably recent relative to its cycle.
    const daysSinceLast = (now.getTime() - dates[dates.length - 1].getTime()) / DAY;
    const staleAfter = cycle === "monthly" ? 45 : 400;
    if (daysSinceLast > staleAfter) continue;

    const amounts = sorted.map((t) => t.amount);
    const monthlyEstimate = cycle === "monthly" ? median(amounts) : median(amounts) / 12;

    out.push({
      name: sorted[sorted.length - 1].name,
      service: resolveService(key),
      cycle,
      monthlyEstimate: Math.round(monthlyEstimate * 100) / 100,
      occurrences: sorted.length,
      firstDate: sorted[0].date,
      lastDate: sorted[sorted.length - 1].date,
    });
  }
  return out.sort((a, b) => b.monthlyEstimate - a.monthlyEstimate);
}
