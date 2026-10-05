import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  plaidCreateLinkToken,
  plaidExchangePublicToken,
  plaidGetTransactions,
} from "@/lib/plaid-functions";
import {
  clearConnectedItem,
  loadConnectedItem,
  saveConnectedItem,
  type ConnectedItem,
} from "@/lib/plaid-client";
import { detectRecurring, type RecurringCharge } from "@/lib/recurring";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Landmark, RefreshCw, Unplug, ArrowRight, Check } from "lucide-react";

/**
 * Plaid Link flow (sandbox prototype):
 *   1. Ask the server for a link token
 *   2. Open the Plaid Link modal (in sandbox: institution "First Platypus
 *      Bank", username user_good / password pass_good)
 *   3. Exchange the public token server-side, keep the access token locally
 *   4. Pull transactions and surface recurring charges for the scan
 */
export function PlaidConnect() {
  const [item, setItem] = useState<ConnectedItem | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recurring, setRecurring] = useState<RecurringCharge[] | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    setItem(loadConnectedItem());
  }, []);

  const connect = async () => {
    setError(null);
    const res = await plaidCreateLinkToken();
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("linkToken" in res) setLinkToken(res.linkToken);
  };

  const handleSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) {
      setError("Plaid returned no public token");
      return;
    }
    const res = await plaidExchangePublicToken({ data: { publicToken } });
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("accessToken" in res) {
      const next = {
        accessToken: res.accessToken,
        itemId: res.itemId,
        connectedAt: new Date().toISOString(),
      };
      saveConnectedItem(next);
      setItem(next);
      setLinkToken(null);
      toast.success("Bank connected", {
        description: "Now pull your transactions to find recurring charges.",
      });
    }
  }, []);

  const loadTransactions = async () => {
    if (!item) return;
    setLoadingTx(true);
    setError(null);
    const res = await plaidGetTransactions({
      data: { accessToken: item.accessToken, months: 6 },
    });
    setLoadingTx(false);
    if (res.error || !res.transactions) {
      setError(res.error ?? "No transactions returned");
      return;
    }
    const found = detectRecurring(res.transactions);
    setRecurring(found);
    if (found.length === 0) {
      toast("No recurring charges found", {
        description: "Sandbox data is sparse — try adding custom subscriptions in the scan.",
      });
    }
  };

  const disconnect = () => {
    clearConnectedItem();
    setItem(null);
    setRecurring(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {!item ? (
          <Button
            onClick={connect}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            <Landmark className="mr-1.5 h-4 w-4" /> Connect your bank (sandbox)
          </Button>
        ) : (
          <>
            <Badge variant="outline" className="rounded-full">
              <Check className="mr-1 h-3 w-3 text-moss" /> Connected
              {item.connectedAt ? ` · ${item.connectedAt.slice(0, 10)}` : ""}
            </Badge>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={loadTransactions}
              disabled={loadingTx}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${loadingTx ? "animate-spin" : ""}`} />
              {loadingTx ? "Pulling…" : "Pull transactions"}
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={disconnect}>
              <Unplug className="mr-1.5 h-4 w-4" /> Disconnect
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {linkToken && (
        <LinkModal token={linkToken} onSuccess={handleSuccess} onExit={() => setLinkToken(null)} />
      )}

      {recurring && (
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Recurring charges detected
            </h2>
            <span className="text-sm text-muted-foreground">
              {recurring.length} found · ≈ $
              {recurring.reduce((s, r) => s + r.monthlyEstimate, 0).toFixed(0)}/mo total
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            These flow into your rewards profile — run the scan to check them against your T-Mobile
            plan, card perks, and memberships.
          </p>
          <div className="mt-4 space-y-2">
            {recurring.map((r) => (
              <div
                key={`${r.name}-${r.lastDate}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4"
              >
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.occurrences}× {r.cycle} · last {r.lastDate}
                    {r.service ? " · recognized service" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-semibold">
                    ${r.monthlyEstimate.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </span>
                  <Link to="/scan">
                    <Button size="sm" variant="outline" className="rounded-full">
                      Add in scan <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Mounted only while a link token exists, so the hook always has a token. */
function LinkModal({
  token,
  onSuccess,
  onExit,
}: {
  token: string;
  onSuccess: (publicToken: string | null) => void;
  onExit: () => void;
}) {
  const { open, ready } = usePlaidLink({ token, onSuccess, onExit });

  useEffect(() => {
    if (ready) open();
  }, [ready, open]);

  return null;
}
