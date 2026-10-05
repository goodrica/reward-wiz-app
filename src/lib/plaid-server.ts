import "@tanstack/react-start/server-only";

/**
 * Plaid server module — SERVER ONLY.
 *
 * This file is imported exclusively by server functions (plaid-functions.ts),
 * so the secrets below never reach the client bundle. Do not import it from
 * components or client modules.
 *
 * Credentials come from the runtime environment (dev: .env / process env;
 * the names intentionally have no VITE_ prefix so Vite keeps them
 * server-side):
 *   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV (sandbox | development | production)
 */

import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

function plaidClient() {
  const clientId = import.meta.env.PLAID_CLIENT_ID as string | undefined;
  const secret = import.meta.env.PLAID_SECRET as string | undefined;
  const env = (import.meta.env.PLAID_ENV as string | undefined) ?? "sandbox";

  if (!clientId || !secret) {
    throw new Error(
      "Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET " +
        "(copy .env.example to .env and fill in sandbox keys from dashboard.plaid.com).",
    );
  }

  const basePath =
    PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox;

  return new PlaidApi(
    new Configuration({
      basePath,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": clientId,
          "PLAID-SECRET": secret,
        },
      },
    }),
  );
}

/** One link token per user; the prototype is single-user, so a fixed id. */
const CLIENT_USER_ID = "rewardwiz-local-user";

export async function createLinkToken(): Promise<{ linkToken: string; expiration: string }> {
  const res = await plaidClient().linkTokenCreate({
    user: { client_user_id: CLIENT_USER_ID },
    client_name: "Reward Wiz",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });
  return {
    linkToken: res.data.link_token,
    expiration: res.data.expiration,
  };
}

export async function exchangePublicToken(
  publicToken: string,
): Promise<{ accessToken: string; itemId: string }> {
  const res = await plaidClient().itemPublicTokenExchange({ public_token: publicToken });
  return {
    accessToken: res.data.access_token,
    itemId: res.data.item_id,
  };
}

export interface RawTransaction {
  date: string;
  name: string;
  amount: number;
  accountId: string;
}

/** Pull the last `months` of posted transactions (oldest-first). */
export async function fetchTransactions(
  accessToken: string,
  months = 6,
): Promise<RawTransaction[]> {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const res = await plaidClient().transactionsGet({
    access_token: accessToken,
    start_date: fmt(start),
    end_date: fmt(end),
  });

  return res.data.transactions
    .filter((t) => !t.pending)
    .map((t) => ({
      date: t.date,
      name: t.merchant_name ?? t.name,
      amount: t.amount,
      accountId: t.account_id,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
