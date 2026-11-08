import { settings, json, productFromOrderId, getProduct, fetchOrder } from "../lib/cashfree.mjs";

export default async (req) => {
  const s = settings();
  const orderId = new URL(req.url).searchParams.get("order_id");
  const pid = productFromOrderId(orderId);
  if (!pid) return json({ status: "NOT_FOUND" }, 404);

  const order = await fetchOrder(s, orderId);
  if (!order) return json({ status: "NOT_FOUND" }, 404);

  // order_status is one of ACTIVE (not paid yet), PAID, EXPIRED, TERMINATED
  return json({
    status: order.order_status,
    paid: order.order_status === "PAID",
    name: order.customer_details?.customer_name || "",
    productName: getProduct(pid).name,
  });
};

export const config = { path: "/api/verify-order" };
