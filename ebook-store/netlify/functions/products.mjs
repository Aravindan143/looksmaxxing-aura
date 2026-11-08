import { listProducts, json } from "../lib/cashfree.mjs";

// Lets the web page show the same prices the server will actually charge.
export default async () => json({ products: listProducts() });

export const config = { path: "/api/products" };
