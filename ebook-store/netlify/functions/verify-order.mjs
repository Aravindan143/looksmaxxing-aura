import { settings, json, isOrderId, getProduct, fetchOrder, isPaid, signatureValid } from "../lib/razorpay.mjs";

export default async (req) => {
  const s = settings();
  const q = new URL(req.url).searchParams;
  const orderId = q.get("order_id");
  if (!isOrderId(orderId)) return json({ status: "NOT_FOUND" }, 404);

  // Right after paying, the page also sends the payment ID and signature. If they're there, they must be genuine.
  const paymentId = q.get("payment_id");
  const signature = q.get("signature");
  if ((paymentId || signature) && !signatureValid(s, orderId, paymentId, signature)) {
    return json({ status: "INVALID", paid: false }, 400);
  }

  // The real answer always comes from Razorpay's server, not from the browser.
  const order = await fetchOrder(s, orderId);
  if (!order) return json({ status: "NOT_FOUND" }, 404);

  const product = getProduct(order.notes?.product);
  return json({
    status: isPaid(order) ? "PAID" : String(order.status || "").toUpperCase(),
    paid: isPaid(order),
    name: order.notes?.name || "",
    productName: product ? product.name : "",
  });
};

export const config = { path: "/api/verify-order" };
