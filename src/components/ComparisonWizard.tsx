import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { TripInput, RewardAccount, ProgramType } from "@/lib/comparison-engine";

export interface WizardData {
  trip: TripInput;
  accounts: RewardAccount[];
  preference: "maximize_value" | "minimize_cash";
}

const PROGRAM_PRESETS: { name: string; type: ProgramType }[] = [
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

const STEPS = ["Trip", "Rewards", "Preferences"] as const;

export function ComparisonWizard({
  initial,
  onComplete,
}: {
  initial?: Partial<WizardData>;
  onComplete: (data: WizardData) => void;
}) {
  const [step, setStep] = useState(0);
  const [trip, setTrip] = useState<TripInput>(
    initial?.trip ?? {
      origin: "",
      destination: "",
      departDate: "",
      returnDate: "",
      travelers: 1,
      needsHotel: true,
      needsCar: false,
    },
  );
  const [accounts, setAccounts] = useState<RewardAccount[]>(initial?.accounts ?? []);
  const [preference, setPreference] = useState<WizardData["preference"]>(initial?.preference ?? "maximize_value");

  const canNext = () => {
    if (step === 0) return trip.origin && trip.destination && trip.departDate;
    return true;
  };

  const next = () => {
    if (step === STEPS.length - 1) {
      onComplete({ trip, accounts, preference });
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div>
      <Stepper step={step} />

      <Card className="mt-6 border-border/60 bg-card p-6 shadow-soft sm:p-8">
        {step === 0 && <TripStep trip={trip} setTrip={setTrip} />}
        {step === 1 && <RewardsStep accounts={accounts} setAccounts={setAccounts} />}
        {step === 2 && <PreferenceStep preference={preference} setPreference={setPreference} />}

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <Button onClick={next} disabled={!canNext()} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            {step === STEPS.length - 1 ? (
              <>
                Compare strategies <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            ) : (
              <>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={label} className="flex flex-1 items-center gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                    ? "border-moss bg-moss/10 text-moss"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={`hidden text-sm font-medium sm:inline ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function TripStep({ trip, setTrip }: { trip: TripInput; setTrip: (t: TripInput) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">Where to?</h2>
      <p className="mt-1 text-sm text-muted-foreground">A few details so we can price every option.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="origin">Origin</Label>
          <Input
            id="origin"
            placeholder="JFK"
            value={trip.origin}
            onChange={(e) => setTrip({ ...trip, origin: e.target.value.toUpperCase().slice(0, 30) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dest">Destination</Label>
          <Input
            id="dest"
            placeholder="LIS"
            value={trip.destination}
            onChange={(e) => setTrip({ ...trip, destination: e.target.value.toUpperCase().slice(0, 30) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dep">Departure</Label>
          <Input
            id="dep"
            type="date"
            value={trip.departDate}
            onChange={(e) => setTrip({ ...trip, departDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ret">Return (optional)</Label>
          <Input
            id="ret"
            type="date"
            value={trip.returnDate ?? ""}
            onChange={(e) => setTrip({ ...trip, returnDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trav">Travelers</Label>
          <Input
            id="trav"
            type="number"
            min={1}
            max={9}
            value={trip.travelers}
            onChange={(e) => setTrip({ ...trip, travelers: Math.max(1, Math.min(9, parseInt(e.target.value) || 1)) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="airline">Preferred airline (optional)</Label>
          <Input
            id="airline"
            placeholder="Delta"
            value={trip.preferredAirline ?? ""}
            onChange={(e) => setTrip({ ...trip, preferredAirline: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="hotel" className="cursor-pointer">Include hotel</Label>
          <Switch id="hotel" checked={trip.needsHotel} onCheckedChange={(v) => setTrip({ ...trip, needsHotel: v })} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="car" className="cursor-pointer">Include rental car</Label>
          <Switch id="car" checked={trip.needsCar} onCheckedChange={(v) => setTrip({ ...trip, needsCar: v })} />
        </div>
      </div>
    </div>
  );
}

function RewardsStep({
  accounts,
  setAccounts,
}: {
  accounts: RewardAccount[];
  setAccounts: (a: RewardAccount[]) => void;
}) {
  const remaining = PROGRAM_PRESETS.filter((p) => !accounts.find((a) => a.program === p.name));

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">Your reward accounts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us which programs you have and your current balance. Skip if you'd rather see all options.
      </p>

      <div className="mt-6 space-y-2">
        {accounts.map((acc, i) => (
          <div key={acc.program} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-2 pl-4">
            <div className="flex-1">
              <div className="text-sm font-medium">{acc.program}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{acc.program_type}</div>
            </div>
            <Input
              type="number"
              min={0}
              placeholder="Balance"
              value={acc.balance || ""}
              onChange={(e) => {
                const next = [...accounts];
                next[i] = { ...acc, balance: Math.max(0, parseInt(e.target.value) || 0) };
                setAccounts(next);
              }}
              className="w-32 text-right"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAccounts(accounts.filter((_, idx) => idx !== i))}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {remaining.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Add a program</div>
          <div className="flex flex-wrap gap-2">
            {remaining.map((p) => (
              <button
                key={p.name}
                onClick={() => setAccounts([...accounts, { program: p.name, program_type: p.type, balance: 0 }])}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary hover:bg-primary/5 hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreferenceStep({
  preference,
  setPreference,
}: {
  preference: WizardData["preference"];
  setPreference: (p: WizardData["preference"]) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">How should we rank?</h2>
      <p className="mt-1 text-sm text-muted-foreground">We'll surface the strategy that wins on your goal.</p>

      <RadioGroup value={preference} onValueChange={(v) => setPreference(v as WizardData["preference"])} className="mt-6 grid gap-3">
        <Label
          htmlFor="pref-value"
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
            preference === "maximize_value" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-foreground/30"
          }`}
        >
          <RadioGroupItem id="pref-value" value="maximize_value" className="mt-0.5" />
          <div>
            <div className="font-medium">Maximize value per point</div>
            <div className="text-sm text-muted-foreground">Get the highest cents-per-point. Best when you have lots of points to burn.</div>
          </div>
        </Label>
        <Label
          htmlFor="pref-cash"
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
            preference === "minimize_cash" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-foreground/30"
          }`}
        >
          <RadioGroupItem id="pref-cash" value="minimize_cash" className="mt-0.5" />
          <div>
            <div className="font-medium">Minimize out-of-pocket</div>
            <div className="text-sm text-muted-foreground">Lowest cash today, even if the per-point value is lower.</div>
          </div>
        </Label>
      </RadioGroup>
    </div>
  );
}
