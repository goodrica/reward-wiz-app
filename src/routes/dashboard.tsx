import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { MatchCard } from "@/components/MatchCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { loadProfile, loadStatuses, saveStatus } from "@/lib/rewards-profile";
import {
  groupMatches,
  runAllScans,
  totalYearlySavings,
  type MatchStatus,
  type RewardMatch,
  type RewardsProfile,
} from "@/lib/rewards-engine";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your savings · Reward Wiz" },
      {
        name: "description",
        content: "Duplicate subscriptions, forgotten perks, and matching offers — ranked by yearly savings.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<RewardsProfile | null>(null);
  const [statuses, setStatuses] = useState<Record<string, MatchStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([
        loadProfile(user?.id ?? null),
        loadStatuses(user?.id ?? null),
      ]);
      setProfile(p);
      setStatuses(s);
      setLoading(false);
    })();
  }, [user?.id]);

  const matches = useMemo(
    () => (profile ? runAllScans(profile) : []),
    [profile],
  );
  const openMatches = matches.filter((m) => statuses[m.id] !== "done" && statuses[m.id] !== "dismissed");
  const grouped = groupMatches(openMatches);
  const totalOpen = totalYearlySavings(openMatches);
  const doneCount = matches.filter((m) => statuses[m.id] === "done").length;

  const setStatus = (match: RewardMatch, status: MatchStatus) => {
    setStatuses((prev) => ({ ...prev, [match.id]: status }));
    saveStatus(
      user?.id ?? null,
      {
        id: match.id,
        type: match.type,
        title: match.title,
        detail: match.detail,
        savingsYearly: match.savingsYearly,
      },
      status,
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground sm:px-6">
          Loading your rewards profile…
        </main>
      </div>
    );
  }

  if (!profile || profile.subscriptions.length === 0) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            No profile yet.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Run the two-minute scan and we'll show you exactly where the money is hiding.
          </p>
          <Link to="/scan">
            <Button size="lg" className="mt-8 rounded-full bg-foreground text-background hover:bg-foreground/90">
              Start my scan <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3 w-3 text-terracotta" />
              {profile.subscriptions.length} subscriptions · {profile.cards.length} cards ·{" "}
              {profile.carrierPlans.length} phone plans
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {openMatches.length > 0 ? (
                <>
                  <span className="text-moss">${Math.round(totalOpen).toLocaleString()}</span> on
                  the table.
                </>
              ) : (
                "You're clean."
              )}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {openMatches.length > 0
                ? `${openMatches.length} way${openMatches.length === 1 ? "" : "s"} to save, ranked by yearly value. ${
                    doneCount > 0 ? `${doneCount} already done — nice.` : ""
                  }`
                : doneCount > 0
                  ? `${doneCount} fix${doneCount === 1 ? "" : "es"} done. We'll keep watching.`
                  : "Nothing matched yet — add more detail to your profile and rescan."}
            </p>
          </div>
          <Link to="/scan">
            <Button variant="outline" className="rounded-full">
              Edit profile <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {grouped.duplicate.length > 0 && (
          <Section title="Duplicate subscriptions" matches={grouped.duplicate} statuses={statuses} onStatus={setStatus} />
        )}
        {grouped.unused_perk.length > 0 && (
          <Section title="Perks you forgot you had" matches={grouped.unused_perk} statuses={statuses} onStatus={setStatus} />
        )}
        {grouped.new_offer.length > 0 && (
          <Section title="Offers that match what you pay for" matches={grouped.new_offer} statuses={statuses} onStatus={setStatus} />
        )}

        {matches.length > 0 && (
          <div className="mt-10 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Handled
            </div>
            {matches
              .filter((m) => statuses[m.id] === "done" || statuses[m.id] === "dismissed")
              .map((m) => (
                <MatchCard key={m.id} match={m} status={statuses[m.id]} onStatus={(s) => setStatus(m, s)} />
              ))}
          </div>
        )}

        <p className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          Savings are estimates from list prices (Sep 2026). Always confirm terms with the
          provider before cancelling anything.
        </p>
      </main>
    </div>
  );
}

function Section({
  title,
  matches,
  statuses,
  onStatus,
}: {
  title: string;
  matches: RewardMatch[];
  statuses: Record<string, MatchStatus>;
  onStatus: (m: RewardMatch, s: MatchStatus) => void;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
        <span className="text-sm text-muted-foreground">{matches.length} found</span>
      </div>
      <div className="mt-4 grid gap-4">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} status={statuses[m.id] ?? "open"} onStatus={(s) => onStatus(m, s)} />
        ))}
      </div>
    </section>
  );
}
