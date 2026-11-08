// Shared helpers for the Razorpay functions.
// Keys and file links come from Netlify environment variables, never from the browser.
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.razorpay.com/v1";

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
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  return {
    keyId,
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    // Test keys start with rzp_test_, live keys with rzp_live_. The key decides the mode.
    mode: keyId.startsWith("rzp_live_") ? "live" : "test",
    downloadDays: Number(process.env.DOWNLOAD_DAYS || "30"),
  };
}

function authHeader(s) {
  return "Basic " + Buffer.from(`${s.keyId}:${s.keySecret}`).toString("base64");
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function isOrderId(id) {
  return typeof id === "string" && /^order_[A-Za-z0-9]{8,32}$/.test(id);
}

export async function createRazorpayOrder(s, payload) {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader(s) },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function fetchOrder(s, orderId) {
  const res = await fetch(`${API}/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: authHeader(s) },
  });
  if (!res.ok) return null;
  return res.json();
}

// Razorpay signs "order_id|payment_id" with your key secret. A match proves the payment is real.
export function signatureValid(s, orderId, paymentId, signature) {
  if (!orderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", s.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && timingSafeEqual(a, b);
}

// An order only counts as paid when Razorpay itself says so, straight from the server.
export function isPaid(order) {
  return !!order && order.status === "paid" && order.amount_paid >= order.amount;
}

export function downloadWindowOpen(s, order) {
  if (!s.downloadDays || !order.created_at) return true;
  const created = Number(order.created_at) * 1000; // Razorpay uses unix seconds
  if (!Number.isFinite(created)) return true;
  return Date.now() - created < s.downloadDays * 24 * 60 * 60 * 1000;
}
