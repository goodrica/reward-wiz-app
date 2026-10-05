import { createServerFn } from "@tanstack/react-start";
import {
  createLinkToken,
  exchangePublicToken,
  fetchTransactions,
  type RawTransaction,
} from "@/lib/plaid-server";

/**
 * Server-function surface for the Plaid prototype. Client code calls these
 * like ordinary async functions; they execute on the server with the Plaid
 * secrets available. All data crossing the boundary is JSON-serializable.
 */

export const plaidCreateLinkToken = createServerFn({ method: "POST" }).handler(async () => {
  try {
    return await createLinkToken();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "link token failed" };
  }
});

export const plaidExchangePublicToken = createServerFn({ method: "POST" })
  .inputValidator((data: { publicToken: string }) => data)
  .handler(async ({ data }) => {
    try {
      return await exchangePublicToken(data.publicToken);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "token exchange failed" };
    }
  });

export const plaidGetTransactions = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string; months?: number }) => data)
  .handler(async ({ data }): Promise<{ transactions?: RawTransaction[]; error?: string }> => {
    try {
      const transactions = await fetchTransactions(data.accessToken, data.months ?? 6);
      return { transactions };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "transactions failed" };
    }
  });
