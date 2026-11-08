// Shared helpers for the Cashfree functions.
// Secrets and file links come from Netlify environment variables, never from the browser.

const API_VERSION = "2023-08-01";

// ---- THE LEVELS: edit names and default prices here -------------------------
// Prices can also be changed without editing code by setting PRICE_L1 / PRICE_L2 / PRICE_L3
// in Netlify. The PDF for each level comes from DOWNLOAD_URL_L1 / _L2 / _L3.
const PRODUCTS = {
  l1: { id: "l1", name: "AuraMax Level 1: Starter Pack", price: 99, priceEnv: "PRICE_L1", urlEnv: "DOWNLOAD_URL_L1" },
  l2: { id: "l2", name: "AuraMax Level 2: Complete Plan", price: 249, priceEnv: "PRICE_L2", urlEnv: "DOWNLOAD_URL_L2" },
  l3: { id: "l3", name: "AuraMax Level 3: Ultimate Pack", price: 499, priceEnv: "PRICE_L3", urlEnv: "DOWNLOAD_URL_L3" },
};
// -----------------------------------------------------------------------------

export function getProduct(id) {
  const p = PRODUCTS[id];
  if (!p) return null;
  const override = Number(process.env[p.priceEnv]);
  return {
    id: p.id,
    name: p.name,
    price: Number.isFinite(override) && override > 0 ? override : p.price,
    downloadUrl: process.env[p.urlEnv] || "",
  };
}

export function listProducts() {
  return Object.keys(PRODUCTS).map((id) => {
    const p = getProduct(id);
    return { id: p.id, name: p.name, price: p.price };
  });
}

export function settings() {
  const mode =
    (process.env.CASHFREE_ENV || "sandbox").toLowerCase() === "production"
      ? "production"
      : "sandbox";
  return {
    mode,
    base: mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
    appId: process.env.CASHFREE_APP_ID,
    secret: process.env.CASHFREE_SECRET_KEY,
    downloadDays: Number(process.env.DOWNLOAD_DAYS || "30"),
  };
}

export function cfHeaders(s) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": s.appId,
    "x-client-secret": s.secret,
  };
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Our order IDs look like ebk_<level>_<timestamp>_<random>, e.g. ebk_l2_1762650000000_a1b2c3d4
// The level is baked into the ID, so we always know which PDF an order is for.
export function productFromOrderId(id) {
  const m = typeof id === "string" && /^ebk_(l1|l2|l3)_\d{10,15}_[a-f0-9]{8}$/.exec(id);
  return m ? m[1] : null;
}

export async function fetchOrder(s, orderId) {
  const res = await fetch(`${s.base}/orders/${encodeURIComponent(orderId)}`, { headers: cfHeaders(s) });
  if (!res.ok) return null;
  return res.json();
}

export function downloadWindowOpen(s, order) {
  if (!s.downloadDays || !order.created_at) return true;
  const created = new Date(order.created_at).getTime();
  if (Number.isNaN(created)) return true;
  return Date.now() - created < s.downloadDays * 24 * 60 * 60 * 1000;
}
