/**
 * Reward Wiz profile persistence.
 *
 * Phase 1 supports two storage modes with one interface:
 *   - signed in  -> Supabase (subscriptions / credit_cards / matches tables)
 *   - anonymous  -> localStorage (same shapes, prefixed keys)
 *
 * The rules engine itself never touches this module — scanning runs on the
 * in-memory profile, and only statuses/preferences persist.
 */

import { supabase } from "@/integrations/supabase/client";
import type { MatchStatus, RewardsProfile, UserSubscription } from "@/lib/rewards-engine";

const LS_PROFILE = "rewardwiz:profile";
const LS_STATUSES = "rewardwiz:statuses";

interface StoredProfile {
  subscriptions: UserSubscription[];
  cards: RewardsProfile["cards"];
  carrierPlans: RewardsProfile["carrierPlans"];
}

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota — the wizard still works in-memory
  }
}

/** Load the rewards profile for a user id (null = anonymous/local). */
export async function loadProfile(userId: string | null): Promise<RewardsProfile> {
  if (!userId) {
    return (
      readLocal<StoredProfile>(LS_PROFILE) ?? {
        subscriptions: [],
        cards: [],
        carrierPlans: [],
      }
    );
  }
  const [subs, cards] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", userId).eq("status", "active"),
    supabase.from("credit_cards").select("*").eq("user_id", userId),
  ]);
  return {
    subscriptions: (subs.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      cost: Number(s.cost),
      cycle: s.cycle as UserSubscription["cycle"],
    })),
    cards: (cards.data ?? []).map((c) => ({ issuer: c.issuer, product: c.product_name })),
    // Carrier plans ride in the profile row until Phase 2 gives them a table.
    carrierPlans: readLocal<StoredProfile>(LS_PROFILE)?.carrierPlans ?? [],
  };
}

/** Persist a full profile (wizard completion). */
export async function saveProfile(userId: string | null, profile: RewardsProfile): Promise<void> {
  if (!userId) {
    writeLocal(LS_PROFILE, profile);
    return;
  }
  // Replace-all is fine for Phase 1 volumes; Phase 2 moves to upserts.
  await supabase.from("subscriptions").delete().eq("user_id", userId);
  await supabase.from("credit_cards").delete().eq("user_id", userId);
  if (profile.subscriptions.length) {
    await supabase.from("subscriptions").insert(
      profile.subscriptions.map((s) => ({
        user_id: userId,
        name: s.name,
        category: s.category ?? "other",
        cost: s.cost,
        cycle: s.cycle,
        source: "catalog" as const,
      })),
    );
  }
  if (profile.cards.length) {
    await supabase.from("credit_cards").insert(
      profile.cards.map((c) => ({
        user_id: userId,
        issuer: c.issuer,
        product_name: c.product,
        source: "catalog" as const,
      })),
    );
  }
  writeLocal(LS_PROFILE, { ...profile, subscriptions: [], cards: [] });
}

/** Load match statuses keyed by match id. */
export async function loadStatuses(userId: string | null): Promise<Record<string, MatchStatus>> {
  const stored: Record<string, MatchStatus> | null = readLocal(LS_STATUSES);
  if (!userId) return stored ?? {};
  const { data } = await supabase
    .from("matches")
    .select("id, status, refs, type")
    .eq("user_id", userId);
  const map: Record<string, MatchStatus> = {};
  for (const row of data ?? []) {
    const matchId = (row.refs as { matchId?: string })?.matchId;
    if (matchId) map[matchId] = row.status as MatchStatus;
  }
  return map;
}

/** Persist a single match status. */
export async function saveStatus(
  userId: string | null,
  match: { id: string; type: string; title: string; detail: string; savingsYearly: number },
  status: MatchStatus,
): Promise<void> {
  if (!userId) {
    const current = readLocal<Record<string, MatchStatus>>(LS_STATUSES) ?? {};
    writeLocal(LS_STATUSES, { ...current, [match.id]: status });
    return;
  }
  const { data } = await supabase
    .from("matches")
    .select("id")
    .eq("user_id", userId)
    .eq("type", match.type)
    .contains("refs", { matchId: match.id })
    .maybeSingle();
  const row = {
    user_id: userId,
    type: match.type,
    title: match.title,
    detail: match.detail,
    savings_estimate: match.savingsYearly,
    period: "yearly" as const,
    status,
    refs: { matchId: match.id },
  };
  if (data?.id) {
    await supabase.from("matches").update({ status }).eq("id", data.id);
  } else {
    await supabase.from("matches").insert(row);
  }
}
