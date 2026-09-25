import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowRight, ArrowLeft, Check, Search } from "lucide-react";
import { CARD_CATALOG, CARRIER_PLAN_CATALOG, SUBSCRIPTION_CATALOG } from "@/lib/rewards-catalog";
import type { BillingCycle, RewardsProfile } from "@/lib/rewards-engine";

const STEPS = ["Subscriptions", "Cards", "Phone plan"] as const;

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "/mo" },
  { value: "yearly", label: "/yr" },
];

export function OnboardingWizard({
  initial,
  onComplete,
}: {
  initial?: RewardsProfile;
  onComplete: (profile: RewardsProfile) => void;
}) {
  const [step, setStep] = useState(0);
  const [subs, setSubs] = useState(initial?.subscriptions ?? []);
  const [cards, setCards] = useState(initial?.cards ?? []);
  const [carrierPlans, setCarrierPlans] = useState(initial?.carrierPlans ?? []);

  const next = () => {
    if (step === STEPS.length - 1) {
      onComplete({ subscriptions: subs, cards, carrierPlans });
    } else {
      setStep((s) => s + 1);
    }
  };

  const yearlyTotal = subs.reduce((sum, s) => {
    const perYear = s.cycle === "yearly" ? s.cost : s.cycle === "monthly" ? s.cost * 12 : 0;
    return sum + perYear;
  }, 0);

  return (
    <div>
      <Stepper step={step} />

      <Card className="mt-6 border-border/60 bg-card p-6 shadow-soft sm:p-8">
        {step === 0 && <SubscriptionsStep subs={subs} setSubs={setSubs} />}
        {step === 1 && <CardsStep cards={cards} setCards={setCards} />}
        {step === 2 && (
          <CarrierStep carrierPlans={carrierPlans} setCarrierPlans={setCarrierPlans} />
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-4">
            {step === 0 && subs.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ≈ <span className="font-semibold text-foreground">${yearlyTotal.toFixed(0)}</span>
                /yr in subscriptions
              </span>
            )}
            <Button
              onClick={next}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              {step === STEPS.length - 1 ? (
                <>
                  Scan for savings <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
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

function SubscriptionsStep({
  subs,
  setSubs,
}: {
  subs: RewardsProfile["subscriptions"];
  setSubs: (s: RewardsProfile["subscriptions"]) => void;
}) {
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCost, setCustomCost] = useState("");
  const [customCycle, setCustomCycle] = useState<BillingCycle>("monthly");

  const catalog = SUBSCRIPTION_CATALOG.filter(
    (c) =>
      !subs.some((s) => s.name.toLowerCase() === c.name.toLowerCase()) &&
      c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const addCustom = () => {
    const cost = parseFloat(customCost);
    if (!customName.trim() || !cost || cost <= 0) return;
    setSubs([...subs, { name: customName.trim(), cost, cycle: customCycle }]);
    setCustomName("");
    setCustomCost("");
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        What do you pay for every month?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick from the common ones, then add anything we missed. Be honest — the scan only works with
        the real list.
      </p>

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search subscriptions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {catalog.map((c) => (
          <button
            key={c.name}
            onClick={() =>
              setSubs([
                ...subs,
                {
                  name: c.name,
                  category: c.category,
                  cost: c.typicalMonthlyCost,
                  cycle: "monthly",
                },
              ])
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary hover:bg-primary/5 hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> {c.name}
          </button>
        ))}
        {catalog.length === 0 && (
          <p className="text-sm text-muted-foreground">No matches — add it below.</p>
        )}
      </div>

      {subs.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Your subscriptions
          </div>
          {subs.map((sub, i) => (
            <div
              key={`${sub.name}-${i}`}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-2 pl-4"
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{sub.name}</div>
                <div className="text-xs text-muted-foreground">
                  ${sub.cost}
                  {sub.cycle === "monthly" ? "/mo" : "/yr"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSubs(subs.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Add your own</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_110px_90px_auto]">
          <Input
            placeholder="Name (e.g. YMCA membership)"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Cost"
            value={customCost}
            onChange={(e) => setCustomCost(e.target.value)}
          />
          <div className="flex overflow-hidden rounded-md border border-input">
            {CYCLES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCustomCycle(c.value)}
                className={`flex-1 px-2 text-xs font-medium transition-colors ${
                  customCycle === c.value
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={addCustom} className="rounded-full">
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function CardsStep({
  cards,
  setCards,
}: {
  cards: RewardsProfile["cards"];
  setCards: (c: RewardsProfile["cards"]) => void;
}) {
  const held = (issuer: string, product: string) =>
    cards.some((c) => c.issuer === issuer && c.product === product);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        Which cards are in your wallet?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Card perks quietly pay for streaming, delivery, and rides — we'll match them against your
        subscriptions. Skip if you'd rather not say.
      </p>

      <div className="mt-6 space-y-2">
        {CARD_CATALOG.map((card) => {
          const active = held(card.issuer, card.product);
          return (
            <button
              key={`${card.issuer} ${card.product}`}
              onClick={() =>
                setCards(
                  active
                    ? cards.filter((c) => !(c.issuer === card.issuer && c.product === card.product))
                    : [...cards, { issuer: card.issuer, product: card.product }],
                )
              }
              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-foreground/30"
              }`}
            >
              <div>
                <div className="font-medium">
                  {card.issuer} {card.product}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {card.perks.map((p) => (
                    <Badge key={p.service} variant="outline" className="rounded-full text-[11px]">
                      {p.service === "disney" && "Disney+ credit"}
                      {p.service === "hulu" && "Hulu credit"}
                      {p.service === "peacock" && "Peacock credit"}
                      {p.service === "walmartplus" && "Walmart+ credit"}
                      {p.service === "uberone" && "Uber credit"}
                      {p.service === "dashpass" && "DashPass"}
                      {p.service === "instacartplus" && "Instacart+ credit"}
                    </Badge>
                  ))}
                </div>
              </div>
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CarrierStep({
  carrierPlans,
  setCarrierPlans,
}: {
  carrierPlans: RewardsProfile["carrierPlans"];
  setCarrierPlans: (c: RewardsProfile["carrierPlans"]) => void;
}) {
  const held = (carrier: string, plan: string) =>
    carrierPlans.some((c) => c.carrier === carrier && c.plan === plan);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        Who's your phone carrier?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Carrier plans are the sneakiest source of free perks — Netflix "On Us", bundled streaming,
        included memberships. Select your plan if you see it.
      </p>

      <div className="mt-6 space-y-2">
        {CARRIER_PLAN_CATALOG.map((p) => {
          const active = held(p.carrier, p.plan);
          return (
            <button
              key={`${p.carrier} ${p.plan}`}
              onClick={() =>
                setCarrierPlans(
                  active
                    ? carrierPlans.filter((c) => !(c.carrier === p.carrier && c.plan === p.plan))
                    : [...carrierPlans, { carrier: p.carrier, plan: p.plan }],
                )
              }
              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-foreground/30"
              }`}
            >
              <div>
                <div className="font-medium">
                  {p.carrier} · {p.plan}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Includes: {p.bundles.map((b) => b.includedTier).join(" · ")}
                </div>
              </div>
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" />}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Don't see your plan? Skip — you can add coverage later. This stays on your device unless
        you're signed in.
      </p>
    </div>
  );
}
