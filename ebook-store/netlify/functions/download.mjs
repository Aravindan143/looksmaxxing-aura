import { settings, productFromOrderId, getProduct, fetchOrder, downloadWindowOpen } from "../lib/cashfree.mjs";

function page(message, status) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Download</title><link rel="stylesheet" href="/styles.css">
<main class="policy"><h1>Download unavailable</h1><p>${message}</p><p><a href="/contact.html">Contact support</a></p></main>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

export default async (req) => {
  const s = settings();
  const orderId = new URL(req.url).searchParams.get("order_id");
  const pid = productFromOrderId(orderId);
  if (!pid) return page("This download link isn't valid.", 404);

  const product = getProduct(pid);
  if (!product.downloadUrl) return page("This file isn't set up yet. The seller needs to add its download link.", 500);

  // Check with Cashfree every time, so a file link is only handed to paid orders.
  const order = await fetchOrder(s, orderId);
  if (!order || order.order_status !== "PAID") {
    return page("We couldn't find a completed payment for this order.", 403);
  }
  // The amount paid must match this level's price, so a cheap order can't unlock a pricier file.
  if (Math.abs(Number(order.order_amount) - product.price) > 0.01) {
    return page("This order doesn't match the level's price. Contact us with your order ID.", 403);
  }
  if (!downloadWindowOpen(s, order)) {
    return page(`Download links stay open for ${s.downloadDays} days. Write to us with your order ID and we'll resend the file.`, 410);
  }

  return Response.redirect(product.downloadUrl, 302);
};

export const config = { path: "/api/download" };
