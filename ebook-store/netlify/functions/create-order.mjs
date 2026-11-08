import { randomUUID } from "node:crypto";
import { settings, getProduct, createRazorpayOrder, json } from "../lib/razorpay.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const s = settings();
  if (!s.keyId || !s.keySecret) {
    return json({ error: "Payments aren't set up yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Netlify." }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // The price always comes from the server's own list, never from the browser.
  const product = getProduct(String(body.product || ""));
  if (!product) return json({ error: "Choose a level." }, 400);

  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().slice(0, 120);
  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);

  if (!name) return json({ error: "Enter your name." }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (!/^[6-9]\d{9}$/.test(phone)) return json({ error: "Enter a 10-digit Indian mobile number." }, 400);

  const amount = Math.round(product.price * 100); // Razorpay counts in paise

  const { ok, data } = await createRazorpayOrder(s, {
    amount,
    currency: "INR",
    receipt: `ebk_${product.id}_${Date.now()}_${randomUUID().slice(0, 4)}`.slice(0, 40),
    notes: { product: product.id, name, email, phone },
  });

  if (!ok || !data.id) {
    console.error("Razorpay create order failed", data);
    return json({ error: data?.error?.description || "Could not start the payment. Try again in a minute." }, 502);
  }

  return json({
    order_id: data.id,
    key_id: s.keyId,
    amount: data.amount,
    currency: data.currency,
    description: product.name,
    mode: s.mode,
  });
};

export const config = { path: "/api/create-order" };
