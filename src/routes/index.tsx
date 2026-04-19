import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Layers, Compass } from "lucide-react";
import heroImage from "@/assets/hero-window.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PointPilot — Book travel the smartest way" },
      {
        name: "description",
        content:
          "Compare cash, points, and hybrid booking strategies across airlines, hotels, and credit-card portals. See real cents-per-point value before you book.",
      },
      { property: "og:title", content: "PointPilot — Book travel the smartest way" },
      {
        property: "og:description",
        content: "A decision engine for travel rewards. Side-by-side strategies ranked by value.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-20">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
                <Sparkles className="h-3 w-3 text-terracotta" />
                A decision engine, not a search engine
              </div>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Book the <em className="font-display italic text-terracotta">smartest</em> way,
                every time.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground text-balance">
                PointPilot compares cash, points, mixed, and split bookings across your loyalty
                programs — then ranks them by real value per point.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/compare">
                  <Button size="lg" className="rounded-full bg-foreground text-background shadow-elevated hover:bg-foreground/90">
                    Start a comparison <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="ghost" className="rounded-full">
                    Save your reward profile
                  </Button>
                </Link>
              </div>

              <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
                {[
                  { v: "5+", l: "Strategies compared" },
                  { v: "20+", l: "Loyalty programs" },
                  { v: "¢/pt", l: "Real value math" },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="font-display text-3xl font-semibold tracking-tight">{s.v}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-elevated">
                <img
                  src={heroImage}
                  alt="Sunset view from an airplane window"
                  width={1536}
                  height={1024}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-card/95 p-4 shadow-soft backdrop-blur">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Best per-point value</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-display text-2xl font-semibold">JFK → LIS</span>
                    <span className="font-display text-2xl font-semibold text-moss">2.14¢</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Split: JetBlue flight + Hyatt hotel</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="border-t border-border/60 bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:grid-cols-3 sm:py-20">
            {[
              {
                icon: Layers,
                title: "Side-by-side strategies",
                body: "All cash, all points, hybrid, portal, and split bookings — every option, one screen.",
              },
              {
                icon: Compass,
                title: "Real cents per point",
                body: "Value math that adapts to how each program prices your specific trip — not generic rules.",
              },
              {
                icon: Sparkles,
                title: "Your stack, your win",
                body: "Save Marriott, Delta, Chase, T-Mobile and more. We rank what's actually feasible for you.",
              },
            ].map((f) => (
              <div key={f.title}>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground shadow-soft">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-balance">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Stop guessing. Start booking.
          </h2>
          <p className="mt-4 text-muted-foreground text-balance">
            Three quick steps and you'll see exactly which strategy wins for your trip.
          </p>
          <Link to="/compare">
            <Button size="lg" className="mt-8 rounded-full bg-foreground text-background hover:bg-foreground/90">
              Compare a trip <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        PointPilot · Built for travelers who refuse to leave value on the table.
      </footer>
    </div>
  );
}
