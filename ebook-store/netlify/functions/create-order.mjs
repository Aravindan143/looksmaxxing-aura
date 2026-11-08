import { randomUUID } from "node:crypto";
import { settings, getProduct, cfHeaders, json } from "../lib/cashfree.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const s = settings();
  if (!s.appId || !s.secret) {
    return json(
      { error: "Payments aren't set up yet. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY in Netlify." },
      500
    );
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

  const orderId = `ebk_${product.id}_${Date.now()}_${randomUUID().replace(/-/g, "").slice(0, 8)}`;
  const origin = new URL(req.url).origin;

  const payload = {
    order_id: orderId,
    order_amount: product.price,
    order_currency: "INR",
    order_note: product.name,
    customer_details: {
      customer_id: `cust_${phone}`,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
    },
    order_meta: {
      // Cashfree replaces {order_id} with the real ID when it sends the buyer back
      return_url: `${origin}/success.html?order_id={order_id}`,
    },
  };

  const res = await fetch(`${s.base}/orders`, {
    method: "POST",
    headers: cfHeaders(s),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.payment_session_id) {
    console.error("Cashfree create order failed", res.status, data);
    return json({ error: data.message || "Could not start the payment. Try again in a minute." }, 502);
  }

  return json({ payment_session_id: data.payment_session_id, order_id: orderId, mode: s.mode });
};

export const config = { path: "/api/create-order" };
