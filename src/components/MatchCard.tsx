import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MatchStatus, MatchType, RewardMatch } from "@/lib/rewards-engine";
import { Check, ExternalLink, CopyX, Repeat, Gift, Tag } from "lucide-react";

const TYPE_META: Record<
  MatchType,
  { label: string; icon: typeof Repeat; tone: string }
> = {
  duplicate: { label: "Duplicate", icon: Repeat, tone: "text-terracotta" },
  unused_perk: { label: "Forgotten perk", icon: Gift, tone: "text-moss" },
  new_offer: { label: "Offer", icon: Tag, tone: "text-foreground" },
};

export function MatchCard({
  match,
  status,
  onStatus,
}: {
  match: RewardMatch;
  status: MatchStatus;
  onStatus: (status: MatchStatus) => void;
}) {
  const meta = TYPE_META[match.type];
  const Icon = meta.icon;

  if (status !== "open") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon className={`h-4 w-4 ${status === "done" ? "text-moss" : "text-muted-foreground"}`} />
          <span
            className={`text-sm ${status === "done" ? "text-muted-foreground line-through" : "text-muted-foreground"}`}
          >
            {match.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {status === "done" ? "Done" : "Dismissed"}
          </span>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => onStatus("open")}>
            Undo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
            <Icon className={`h-4 w-4 ${meta.tone}`} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-semibold tracking-tight">{match.title}</h3>
              <Badge variant="outline" className="rounded-full text-[11px]">
                {meta.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{match.detail}</p>
            {match.sourceUrls.length > 0 && (
              <a
                href={match.sourceUrls[0]}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
              >
                Verify before you act <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-2xl font-semibold tracking-tight text-moss">
            ${Math.round(match.savingsYearly).toLocaleString()}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">/yr</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
        <Button
          size="sm"
          className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          onClick={() => onStatus("done")}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" /> Marked done
        </Button>
        <Button size="sm" variant="ghost" className="rounded-full" onClick={() => onStatus("dismissed")}>
          <CopyX className="mr-1.5 h-3.5 w-3.5" /> Not for me
        </Button>
        <span className="ml-auto text-[11px] text-muted-foreground">Estimate — confirm terms</span>
      </div>
    </Card>
  );
}
