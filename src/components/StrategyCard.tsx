import { type Strategy, formatCurrency, formatPoints, compareToBenchmark } from "@/lib/comparison-engine";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, BedDouble, Car, Check, AlertCircle, TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";

const ICONS = {
  flight: Plane,
  hotel: BedDouble,
  car: Car,
} as const;

const TAG_LABEL: Record<string, string> = {
  "best-value": "Best per-point value",
  "lowest-cash": "Lowest cash",
  baseline: "Baseline",
  bundled: "One-stop",
  balanced: "Balanced",
  alternative: "Alternative",
};

export function StrategyCard({ strategy, rank, highlight }: { strategy: Strategy; rank: number; highlight?: string }) {
  return (
    <Card
      className={`overflow-hidden border-border/60 bg-card p-0 transition-all ${
        highlight ? "shadow-glow ring-1 ring-primary/40" : "shadow-soft hover:shadow-elevated"
      } ${!strategy.feasible ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-gradient-sunset/40 px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              #{rank}
            </span>
            {highlight && (
              <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                {highlight}
              </Badge>
            )}
            {strategy.tags.map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full bg-secondary/80 font-normal">
                {TAG_LABEL[t] ?? t}
              </Badge>
            ))}
          </div>
          <h3 className="font-display text-xl font-semibold leading-tight tracking-tight text-balance">
            {strategy.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground text-balance">{strategy.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Out of pocket</div>
          <div className="mt-1 font-display text-2xl font-semibold">
            {formatCurrency(strategy.totalCash)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Points used</div>
          <div className="mt-1 font-display text-2xl font-semibold">
            {strategy.totalPoints > 0 ? formatPoints(strategy.totalPoints) : "—"}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> Value / point
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`font-display text-2xl font-semibold ${
                strategy.centsPerPoint >= 1.5 ? "text-moss" : ""
              }`}
            >
              {strategy.centsPerPoint > 0 ? strategy.centsPerPoint.toFixed(2) : "—"}
            </span>
            {strategy.centsPerPoint > 0 && <span className="text-xs text-muted-foreground">¢</span>}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-4">
        <div className="space-y-2">
          {strategy.legs.map((leg, i) => {
            const Icon = ICONS[leg.type];
            return (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-foreground/80">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{leg.provider}</span>
                </div>
                <div className="text-right text-muted-foreground">
                  {leg.pointsCost > 0 && (
                    <span className="font-mono text-xs">{formatPoints(leg.pointsCost)} pts</span>
                  )}
                  {leg.pointsCost > 0 && leg.cashCost > 0 && <span className="mx-1.5">+</span>}
                  {leg.cashCost > 0 && (
                    <span className="font-mono text-xs">{formatCurrency(Math.round(leg.cashCost))}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(strategy.perks.length > 0 || strategy.tradeoffs.length > 0) && (
        <div className="grid gap-4 border-t border-border/60 px-6 py-4 text-sm sm:grid-cols-2">
          <ul className="space-y-1.5">
            {strategy.perks.map((p) => (
              <li key={p} className="flex items-start gap-2 text-foreground/80">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5">
            {strategy.tradeoffs.map((t) => (
              <li key={t} className="flex items-start gap-2 text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta/70" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!strategy.feasible && strategy.feasibilityReason && (
        <div className="border-t border-destructive/30 bg-destructive/5 px-6 py-3 text-sm text-destructive">
          {strategy.feasibilityReason}
        </div>
      )}
    </Card>
  );
}
