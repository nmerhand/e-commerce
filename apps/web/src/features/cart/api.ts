import { apiRequest, apiRequestWithCsrf } from "../../lib/api";
import type { Cart } from "./types";

export async function fetchCart(signal?: AbortSignal) {
  const response = await apiRequest<{ cart: Cart }>("/api/cart", { signal });
  return response.cart;
}

export async function addCartItem(productId: string, quantity: number) {
  const response = await apiRequestWithCsrf<{ cart: Cart }>("/api/cart/items", {
    method: "POST",
    body: { productId, quantity },
  });
  return response.cart;
}

export async function updateCartItem(productId: string, quantity: number) {
  const response = await apiRequestWithCsrf<{ cart: Cart }>(
    `/api/cart/items/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      body: { quantity },
    },
  );
  return response.cart;
}

export async function removeCartItem(productId: string) {
  const response = await apiRequestWithCsrf<{ cart: Cart }>(
    `/api/cart/items/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  return response.cart;
}
