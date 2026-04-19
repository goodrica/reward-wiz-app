import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ComparisonWizard, type WizardData } from "@/components/ComparisonWizard";
import { StrategyCard } from "@/components/StrategyCard";
import { Button } from "@/components/ui/button";
import { calculateStrategies, rankStrategies, type Strategy, type RankMode } from "@/lib/comparison-engine";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Bookmark } from "lucide-react";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "New comparison · PointPilot" },
      { name: "description", content: "Enter your trip and reward balances to compare booking strategies." },
    ],
  }),
  component: Compare,
});

function Compare() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<WizardData | null>(null);
  const [strategies, setStrategies] = useState<Strategy[] | null>(null);
  const [mode, setMode] = useState<RankMode>("value");
  const [initial, setInitial] = useState<Partial<WizardData> | undefined>();
  const [saving, setSaving] = useState(false);

  // Preload saved accounts/preference for signed-in users
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: accs }, { data: prof }] = await Promise.all([
        supabase.from("reward_accounts").select("program, program_type, balance").eq("user_id", user.id),
        supabase.from("profiles").select("preference").eq("id", user.id).maybeSingle(),
      ]);
      setInitial({
        accounts: (accs ?? []).map((a) => ({ program: a.program, program_type: a.program_type as "airline" | "hotel" | "credit_card" | "telecom", balance: Number(a.balance) })),
        preference: (prof?.preference as "maximize_value" | "minimize_cash") ?? "maximize_value",
      });
    })();
  }, [user]);

  const handleComplete = (d: WizardData) => {
    setData(d);
    setMode(d.preference === "minimize_cash" ? "cash" : "value");
    const strats = calculateStrategies(d.trip, d.accounts);
    setStrategies(strats);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ranked = strategies ? rankStrategies(strategies, mode) : [];

  const saveTrip = async () => {
    if (!user || !data) {
      toast("Sign in to save trips", { description: "Create a free account to keep your comparisons." });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("saved_trips").insert({
      user_id: user.id,
      origin: data.trip.origin,
      destination: data.trip.destination,
      depart_date: data.trip.departDate,
      return_date: data.trip.returnDate || null,
      trip_data: { trip: data.trip, accounts: data.accounts, strategies: ranked } as never,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save trip", { description: error.message });
    } else {
      toast.success("Trip saved", { description: "Find it anytime in My rewards." });
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {!strategies && (
          <>
            <div className="mb-8">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Plan a smarter trip.
              </h1>
              <p className="mt-2 text-muted-foreground">
                Three quick steps. We'll rank every strategy by your goal.
              </p>
            </div>
            <ComparisonWizard initial={initial} onComplete={handleComplete} />
          </>
        )}

        {strategies && data && (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setStrategies(null);
                setData(null);
              }}
              className="mb-4 -ml-2 rounded-full text-muted-foreground"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Edit trip
            </Button>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {data.trip.origin} → {data.trip.destination}
                </div>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {ranked.length} ways to book.
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ranked by {mode === "value" ? "best per-point value" : "lowest cash out"}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-border bg-card p-1">
                  <button
                    onClick={() => setMode("value")}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      mode === "value" ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                  >
                    Best value
                  </button>
                  <button
                    onClick={() => setMode("cash")}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      mode === "cash" ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                  >
                    Lowest cash
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveTrip}
                  disabled={saving}
                  className="rounded-full"
                >
                  <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                  {user ? "Save trip" : "Sign in to save"}
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {ranked.map((s, i) => (
                <StrategyCard
                  key={s.id}
                  strategy={s}
                  rank={i + 1}
                  highlight={i === 0 ? (mode === "value" ? "Best per-point value" : "Lowest cash out") : undefined}
                />
              ))}
            </div>

            {!user && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                <h3 className="font-display text-lg font-semibold">Save your reward profile</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in once and we'll remember your programs and balances next time.
                </p>
                <Button onClick={() => navigate({ to: "/auth" })} className="mt-4 rounded-full bg-foreground text-background hover:bg-foreground/90">
                  Create a free account
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
