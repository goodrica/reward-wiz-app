import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calculator, TrendingUp, ShieldCheck, Lightbulb } from "lucide-react";
import { CppCalculator } from "@/components/CppCalculator";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Best practices for points & miles — PointPilot" },
      {
        name: "description",
        content:
          "How to value airline miles, hotel points, and credit-card rewards using the cents-per-point methodology trusted by The Points Guy, NerdWallet, and AwardWallet.",
      },
      { property: "og:title", content: "Best practices for points & miles — PointPilot" },
      {
        property: "og:description",
        content:
          "The industry-standard cents-per-point method, baseline valuations, and the rules of thumb seasoned travelers use.",
      },
    ],
  }),
  component: LearnPage,
});

const BENCHMARKS = {
  flights: [
    ["American AAdvantage", 1.6],
    ["Alaska Atmos Rewards", 1.4],
    ["JetBlue TrueBlue", 1.35],
    ["United MileagePlus", 1.35],
    ["Southwest Rapid Rewards", 1.25],
    ["Delta SkyMiles", 1.2],
  ],
  hotels: [
    ["World of Hyatt", 1.65],
    ["Marriott Bonvoy", 0.8],
    ["Wyndham Rewards", 0.65],
    ["IHG One Rewards", 0.6],
    ["Hilton Honors", 0.4],
  ],
  portals: [
    ["Bilt Rewards", 2.2],
    ["Chase Ultimate Rewards", 2.05],
    ["Amex Membership Rewards", 2.0],
    ["Citi ThankYou Rewards", 1.9],
    ["Capital One Venture", 1.85],
  ],
} as const;

const RULES = [
  {
    icon: Calculator,
    title: "Use cents-per-point as the universal yardstick",
    body: "CPP = (cash price − taxes & fees) ÷ points required × 100. It's the same math TPG, NerdWallet, AwardWallet and Bankrate publish every month. Apples to apples, every program.",
  },
  {
    icon: TrendingUp,
    title: "Beat the published baseline, or pay cash",
    body: "If your redemption falls below the program's baseline, you're better off paying cash and banking the points for a higher-value trip. Above baseline = a 'good' redemption.",
  },
  {
    icon: ShieldCheck,
    title: "Never redeem hotel points at a fixed-rate portal",
    body: "Hotel currencies (Marriott, Hilton, IHG) are worth far more booked directly through the brand on award nights than dumped into a credit-card travel portal at 1¢ each.",
  },
  {
    icon: Lightbulb,
    title: "Transferable points are king",
    body: "Chase, Amex, Capital One, Citi and Bilt let you transfer to airline & hotel partners — often unlocking 2–5¢ per point. Keep flexibility until you find a sweet spot.",
  },
  {
    icon: BookOpen,
    title: "Always factor in taxes, fees, and 'opportunity cost'",
    body: "An award flight still owes ~$11 in US fees (and far more on partners with fuel surcharges). Subtract them from the cash equivalent before computing CPP.",
  },
];

function LearnPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
          <BookOpen className="h-3 w-3 text-terracotta" />
          The methodology, in plain English
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
          How smart travelers actually value points.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground text-balance">
          PointPilot doesn't invent a new scoring system. We use the same{" "}
          <strong className="text-foreground">cents-per-point (CPP)</strong> method that The
          Points Guy, NerdWallet, AwardWallet, and Bankrate have published for over a decade —
          then apply it to every booking strategy side-by-side.
        </p>

        {/* Formula */}
        <Card className="mt-10 border-border/60 bg-gradient-sunset/40 p-6 shadow-soft">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            The formula
          </div>
          <div className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            CPP ={" "}
            <span className="text-terracotta">
              (cash price − taxes &amp; fees) ÷ points required × 100
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Example: a $480 Delta ticket bookable for 35,000 SkyMiles + $11.20 fees ={" "}
            <span className="font-mono text-foreground">($480 − $11.20) ÷ 35,000 × 100 = 1.34¢</span>{" "}
            per mile. Above Delta's 1.2¢ baseline → a good redemption.
          </p>
        </Card>

        {/* Interactive calculator */}
        <div className="mt-10">
          <CppCalculator />
        </div>

        {/* Rules */}
        <h2 className="mt-16 font-display text-3xl font-semibold tracking-tight">
          Five rules every points pro follows
        </h2>
        <div className="mt-6 grid gap-4">
          {RULES.map((r) => (
            <Card
              key={r.title}
              className="flex gap-4 border-border/60 p-5 shadow-soft transition-shadow hover:shadow-elevated"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-soft">
                <r.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground text-balance">{r.body}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Benchmarks */}
        <h2 className="mt-16 font-display text-3xl font-semibold tracking-tight">
          Industry baseline valuations
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Source:{" "}
          <a
            href="https://thepointsguy.com/loyalty-programs/monthly-valuations"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            The Points Guy monthly valuations, May 2026
          </a>
          . PointPilot uses these exact numbers to flag whether each strategy beats the
          published benchmark.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(["flights", "hotels", "portals"] as const).map((cat) => (
            <Card key={cat} className="border-border/60 p-5 shadow-soft">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {cat === "portals" ? "Credit-card points" : cat}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {BENCHMARKS[cat].map(([name, cpp]) => (
                  <li key={name} className="flex items-baseline justify-between gap-3">
                    <span className="text-foreground/80">{name}</span>
                    <span className="font-mono text-foreground">{(cpp as number).toFixed(2)}¢</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-border/60 bg-card p-8 text-center shadow-soft">
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            See it applied to your trip
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Every PointPilot strategy is scored against these baselines automatically.
          </p>
          <Link to="/compare">
            <Button
              size="lg"
              className="mt-6 rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              Run a comparison <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
