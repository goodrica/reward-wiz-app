import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { PlaidConnect } from "@/components/PlaidConnect";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Connected accounts · Reward Wiz" },
      {
        name: "description",
        content:
          "Connect your bank (sandbox) and automatically detect recurring charges to feed the rewards scan.",
      },
    ],
  }),
  component: Accounts,
});

function Accounts() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Your money, on autopilot.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Connect a bank and we'll find what you're paying for every month — then the scan checks
            each one against your T-Mobile plan, card perks, and memberships.
          </p>
        </div>
        <PlaidConnect />
        <p className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          Sandbox prototype: data comes from Plaid's test environment. Access tokens stay in this
          browser; production would vault them server-side.
        </p>
      </main>
    </div>
  );
}
