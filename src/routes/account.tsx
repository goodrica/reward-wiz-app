import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { ProgramType } from "@/lib/comparison-engine";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My rewards · PointPilot" },
      { name: "description", content: "Manage your reward accounts, balances, and saved trips." },
    ],
  }),
  component: Account,
});

interface AccountRow {
  id: string;
  program: string;
  program_type: ProgramType;
  balance: number;
  last_synced_at: string | null;
  last_sync_source: string | null;
}
interface SavedTrip {
  id: string;
  origin: string;
  destination: string;
  depart_date: string;
  return_date: string | null;
  created_at: string;
}

const PRESETS: { name: string; type: ProgramType }[] = [
  { name: "Delta SkyMiles", type: "airline" },
  { name: "JetBlue TrueBlue", type: "airline" },
  { name: "United MileagePlus", type: "airline" },
  { name: "American AAdvantage", type: "airline" },
  { name: "Marriott Bonvoy", type: "hotel" },
  { name: "Hilton Honors", type: "hotel" },
  { name: "Hyatt", type: "hotel" },
  { name: "Chase Ultimate Rewards", type: "credit_card" },
  { name: "Amex Membership Rewards", type: "credit_card" },
  { name: "Capital One Venture", type: "credit_card" },
  { name: "T-Mobile Travel", type: "telecom" },
];

function Account() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: accs }, { data: tr }, { data: prof }] = await Promise.all([
        supabase.from("reward_accounts").select("*").eq("user_id", user.id).order("program_type"),
        supabase.from("saved_trips").select("id, origin, destination, depart_date, return_date, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      ]);
      setAccounts((accs ?? []) as AccountRow[]);
      setTrips((tr ?? []) as SavedTrip[]);
      setName(prof?.display_name ?? "");
    })();
  }, [user]);

  const addProgram = async (preset: { name: string; type: ProgramType }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("reward_accounts")
      .insert({ user_id: user.id, program: preset.name, program_type: preset.type, balance: 0 })
      .select()
      .single();
    if (error) toast.error(error.message);
    else if (data) setAccounts((a) => [...a, data as AccountRow]);
  };

  const updateBalance = async (id: string, balance: number) => {
    const now = new Date().toISOString();
    setAccounts((a) => a.map((r) => (r.id === id ? { ...r, balance, last_synced_at: now, last_sync_source: "manual" } : r)));
    const { error } = await supabase
      .from("reward_accounts")
      .update({ balance, last_synced_at: now, last_sync_source: "manual" })
      .eq("id", id);
    if (error) toast.error(error.message);
  };

  const removeAccount = async (id: string) => {
    setAccounts((a) => a.filter((r) => r.id !== id));
    await supabase.from("reward_accounts").delete().eq("id", id);
  };

  const removeTrip = async (id: string) => {
    setTrips((t) => t.filter((x) => x.id !== id));
    await supabase.from("saved_trips").delete().eq("id", id);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
      </div>
    );
  }

  const remaining = PRESETS.filter((p) => !accounts.find((a) => a.program === p.name));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Your profile</div>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {name ? `Hi, ${name}.` : "My rewards"}
          </h1>
          <p className="mt-1 text-muted-foreground">Keep balances current so we recommend strategies you can actually book.</p>
        </div>

        <section className="mb-12">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight">Reward accounts</h2>
            <span className="text-xs text-muted-foreground">{accounts.length} program{accounts.length === 1 ? "" : "s"}</span>
          </div>

          <Card className="divide-y divide-border/60 border-border/60 bg-card p-0 shadow-soft">
            {accounts.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Add your first reward program below.
              </div>
            )}
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{acc.program}</span>
                    {acc.last_sync_source === "extension" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                        via extension
                      </span>
                    )}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {acc.program_type}
                    {acc.last_synced_at && (
                      <span className="ml-2 normal-case tracking-normal">
                        · synced {new Date(acc.last_synced_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Label htmlFor={`bal-${acc.id}`} className="sr-only">Balance</Label>
                  <Input
                    id={`bal-${acc.id}`}
                    type="number"
                    min={0}
                    value={acc.balance || ""}
                    placeholder="0"
                    onChange={(e) => updateBalance(acc.id, Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-32 text-right font-mono"
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAccount(acc.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Card>

          {remaining.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Add a program</div>
              <div className="flex flex-wrap gap-2">
                {remaining.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => addProgram(p)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary hover:bg-primary/5 hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" /> {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight">Saved trips</h2>
            <Link to="/compare" className="text-xs font-medium text-primary hover:underline">
              + New comparison
            </Link>
          </div>
          <Card className="divide-y divide-border/60 border-border/60 bg-card p-0 shadow-soft">
            {trips.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No saved trips yet. Run a comparison and tap Save trip.
              </div>
            )}
            {trips.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {t.origin} → {t.destination}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.depart_date}
                    {t.return_date ? ` – ${t.return_date}` : ""}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTrip(t.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </Card>
        </section>
      </main>
    </div>
  );
}
