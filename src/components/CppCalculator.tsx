import { useMemo, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { getBenchmarkCpp } from "@/lib/comparison-engine";

const PROGRAMS = [
  "American AAdvantage",
  "Alaska Atmos Rewards",
  "JetBlue TrueBlue",
  "United MileagePlus",
  "Southwest Rapid Rewards",
  "Delta SkyMiles",
  "World of Hyatt",
  "Marriott Bonvoy",
  "Wyndham Rewards",
  "IHG One Rewards",
  "Hilton Honors",
  "Bilt Rewards",
  "Chase Ultimate Rewards",
  "Amex Membership Rewards",
  "Citi ThankYou Rewards",
  "Capital One Venture",
];

// Validate inputs: non-negative finite numbers within sane caps to prevent overflow / abuse.
const numberField = z
  .string()
  .trim()
  .max(12, { message: "Too long" })
  .refine((v) => v === "" || /^\d*\.?\d*$/.test(v), { message: "Numbers only" });

const formSchema = z.object({
  cash: numberField,
  fees: numberField,
  points: numberField,
  program: z.string().trim().max(64).optional(),
});

function parseAmount(v: string, max: number): number {
  if (!v) return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export function CppCalculator() {
  const [cash, setCash] = useState("480");
  const [fees, setFees] = useState("11.20");
  const [points, setPoints] = useState("35000");
  const [program, setProgram] = useState<string>("Delta SkyMiles");
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(() => {
    const parsed = formSchema.safeParse({ cash, fees, points, program });
    if (!parsed.success) {
      return { cpp: 0, net: 0, valid: false };
    }
    const cashN = parseAmount(cash, 1_000_000);
    const feesN = parseAmount(fees, 1_000_000);
    const pointsN = parseAmount(points, 100_000_000);
    const net = Math.max(0, cashN - feesN);
    const cpp = pointsN > 0 ? (net * 100) / pointsN : 0;
    return { cpp, net, valid: cashN > 0 && pointsN > 0 };
  }, [cash, fees, points, program]);

  const benchmark = program ? getBenchmarkCpp(program) : undefined;
  const deltaPct = benchmark && result.cpp > 0 ? ((result.cpp - benchmark) / benchmark) * 100 : 0;
  const status: "above" | "at" | "below" | null =
    !benchmark || !result.valid ? null : deltaPct >= 5 ? "above" : deltaPct <= -5 ? "below" : "at";

  const StatusIcon = status === "above" ? ArrowUp : status === "below" ? ArrowDown : Minus;
  const tone =
    status === "above" ? "text-moss" : status === "below" ? "text-terracotta" : "text-muted-foreground";
  const verdict =
    status === "above"
      ? "Above baseline — book it."
      : status === "below"
        ? "Below baseline — pay cash and save the points."
        : status === "at"
          ? "Right at baseline — a fair redemption."
          : "Enter cash and points to see your value.";

  function handleChange(setter: (v: string) => void, value: string) {
    // Strip anything that isn't a digit or single decimal — defense-in-depth.
    const cleaned = value.replace(/[^\d.]/g, "").slice(0, 12);
    const parts = cleaned.split(".");
    const safe = parts.length <= 2 ? cleaned : `${parts[0]}.${parts.slice(1).join("")}`;
    setter(safe);
    setError(null);
    const check = formSchema.safeParse({ cash, fees, points, program });
    if (!check.success) setError(check.error.issues[0]?.message ?? "Invalid input");
  }

  return (
    <Card className="border-border/60 p-6 shadow-soft sm:p-8">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-soft">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">CPP calculator</h3>
          <p className="text-xs text-muted-foreground">Try it with any redemption you're considering.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cpp-cash">Cash price ($)</Label>
          <Input
            id="cpp-cash"
            inputMode="decimal"
            value={cash}
            onChange={(e) => handleChange(setCash, e.target.value)}
            placeholder="480"
            maxLength={12}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpp-fees">Taxes &amp; fees ($)</Label>
          <Input
            id="cpp-fees"
            inputMode="decimal"
            value={fees}
            onChange={(e) => handleChange(setFees, e.target.value)}
            placeholder="11.20"
            maxLength={12}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpp-points">Points required</Label>
          <Input
            id="cpp-points"
            inputMode="numeric"
            value={points}
            onChange={(e) => handleChange(setPoints, e.target.value)}
            placeholder="35000"
            maxLength={12}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpp-program">Program (optional)</Label>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger id="cpp-program">
              <SelectValue placeholder="Compare to baseline" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-6 grid gap-4 rounded-2xl bg-gradient-sunset/40 p-5 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Net cash value</div>
          <div className="mt-1 font-display text-2xl font-semibold">
            ${result.net.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your CPP</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`font-display text-2xl font-semibold ${result.cpp >= 1.5 ? "text-moss" : ""}`}>
              {result.valid ? result.cpp.toFixed(2) : "—"}
            </span>
            {result.valid && <span className="text-xs text-muted-foreground">¢</span>}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">vs benchmark</div>
          {status && benchmark ? (
            <div className={`mt-1 flex items-center gap-1 ${tone}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="font-display text-lg font-semibold">
                {status === "at"
                  ? "At baseline"
                  : `${Math.round(Math.abs(deltaPct))}% ${status === "above" ? "above" : "below"}`}
              </span>
            </div>
          ) : (
            <div className="mt-1 font-display text-lg font-semibold text-muted-foreground">—</div>
          )}
          {benchmark && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              TPG baseline: {benchmark.toFixed(2)}¢
            </div>
          )}
        </div>
      </div>

      <p className={`mt-4 text-sm ${tone}`}>{verdict}</p>
    </Card>
  );
}
