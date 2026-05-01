import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Chrome, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/extension")({
  head: () => ({
    meta: [
      { title: "Browser extension · PointPilot" },
      {
        name: "description",
        content:
          "Install the PointPilot Companion for Chrome to sync your Marriott, JetBlue, and Delta point balances automatically.",
      },
    ],
  }),
  component: ExtensionPage,
});

const SUPPORTED = [
  { name: "Marriott Bonvoy", note: "Hotel points · marriott.com" },
  { name: "JetBlue TrueBlue", note: "Airline miles · jetblue.com" },
  { name: "Delta SkyMiles", note: "Airline miles · delta.com" },
];

function ExtensionPage() {
  const download = () => {
    fetch("/pointpilot-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "pointpilot-extension.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        toast.success("Extension downloaded — see install steps below.");
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Companion app</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Stop typing your balances.
          </h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            Install the PointPilot Companion for Chrome. Sign in once, visit your loyalty
            account, and your balance syncs to PointPilot in a click.
          </p>
        </div>

        <Card className="mb-8 border-border/60 bg-card p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-display text-lg font-semibold">PointPilot Companion</div>
              <div className="text-sm text-muted-foreground">v1.0.0 · Chrome / Edge / Brave / Arc</div>
            </div>
            <Button onClick={download} size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              <Download className="mr-2 h-4 w-4" />
              Download (.zip)
            </Button>
          </div>
        </Card>

        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-semibold tracking-tight">Install in 4 steps</h2>
          <ol className="space-y-3 text-sm">
            {[
              "Unzip the downloaded file somewhere you'll keep it (e.g. your Documents folder).",
              <>
                Open <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">chrome://extensions</code> in your browser.
              </>,
              "Toggle Developer mode (top-right corner).",
              "Click Load unpacked and select the unzipped folder.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Then click the puzzle icon in your toolbar, pin PointPilot, and sign in with the same email/password you use here.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-semibold tracking-tight">Supported in v1</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {SUPPORTED.map((p) => (
              <Card key={p.name} className="border-border/60 bg-card p-4 shadow-soft">
                <div className="font-medium">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.note}</div>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Hilton, Hyatt, United, and American are coming next. Want a program added? Tell us.
          </p>
        </section>

        <section className="mb-10 grid gap-3 sm:grid-cols-2">
          <Card className="border-border/60 bg-card p-5 shadow-soft">
            <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
            <div className="font-display font-semibold">No password sharing</div>
            <p className="mt-1 text-sm text-muted-foreground">
              You log in to each program in your own browser. The extension only reads what's
              already on the page — your loyalty passwords never touch PointPilot.
            </p>
          </Card>
          <Card className="border-border/60 bg-card p-5 shadow-soft">
            <Sparkles className="mb-2 h-5 w-5 text-primary" />
            <div className="font-display font-semibold">One-click sync</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Detected balances appear in the popup. Hit Sync and your{" "}
              <Link to="/account" className="underline">My rewards</Link> page updates instantly.
            </p>
          </Card>
        </section>

        <section className="mb-12 rounded-2xl border border-border/60 bg-muted/30 p-5 text-sm text-muted-foreground">
          <div className="mb-1 flex items-center gap-2 font-semibold text-foreground">
            <Chrome className="h-4 w-4" /> Honest caveats
          </div>
          <ul className="ml-4 list-disc space-y-1">
            <li>This isn't an official integration with the airlines or hotels — it's a personal-use convenience tool.</li>
            <li>Loyalty sites occasionally redesign. If detection breaks, we'll ship an update.</li>
            <li>Firefox and Safari versions aren't packaged yet. Chromium browsers (Chrome, Edge, Brave, Arc, Opera) all work.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
