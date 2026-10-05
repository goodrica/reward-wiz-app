/**
 * Client-side storage for the Plaid-connected item.
 *
 * PROTOTYPE ONLY: the access token lives in this browser's localStorage.
 * That's acceptable for a single-user sandbox prototype (the token only
 * reads sandbox data), but real access tokens must live server-side in a
 * vault before this ships — anyone holding one can read the account until
 * it is revoked.
 */

const LS_KEY = "rewardwiz:plaid";

export interface ConnectedItem {
  accessToken: string;
  itemId: string;
  connectedAt: string;
}

export function loadConnectedItem(): ConnectedItem | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ConnectedItem) : null;
  } catch {
    return null;
  }
}

export function saveConnectedItem(item: ConnectedItem) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(item));
  } catch {
    // storage unavailable — connection will not persist
  }
}

export function clearConnectedItem() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}
