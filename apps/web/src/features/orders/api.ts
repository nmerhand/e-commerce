import { apiRequest, apiRequestWithCsrf } from "../../lib/api";
import type { OrderSummary, ShippingAddress } from "./types";

export async function checkout(address: ShippingAddress) {
  return apiRequestWithCsrf<{
    order: OrderSummary;
    payment: { mode: "simulated"; status: "paid" };
  }>("/api/orders", {
    method: "POST",
    body: address,
  });
}

export async function fetchOrders(signal: AbortSignal) {
  const response = await apiRequest<{ orders: OrderSummary[] }>("/api/orders", {
    signal,
  });
  return response.orders;
}
