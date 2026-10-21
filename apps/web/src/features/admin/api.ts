import { apiRequest, apiRequestWithCsrf } from "../../lib/api";
import type {
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminProductInput,
} from "./types";

export async function fetchAdminData(signal: AbortSignal) {
  const [categories, products, orders] = await Promise.all([
    apiRequest<{ categories: AdminCategory[] }>("/api/admin/categories", {
      signal,
    }),
    apiRequest<{ products: AdminProduct[] }>("/api/admin/products", {
      signal,
    }),
    apiRequest<{ orders: AdminOrder[] }>("/api/admin/orders", { signal }),
  ]);
  return {
    categories: categories.categories,
    products: products.products,
    orders: orders.orders,
  };
}

export async function saveAdminProduct(
  product: AdminProductInput,
  id?: string,
) {
  const response = await apiRequestWithCsrf<{ product: AdminProduct }>(
    id
      ? `/api/admin/products/${encodeURIComponent(id)}`
      : "/api/admin/products",
    {
      method: id ? "PUT" : "POST",
      body: product,
    },
  );
  return response.product;
}

export function deactivateAdminProduct(id: string) {
  return apiRequestWithCsrf(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function shipAdminOrder(orderNumber: string) {
  const response = await apiRequestWithCsrf<{ order: AdminOrder }>(
    `/api/admin/orders/${encodeURIComponent(orderNumber)}/ship`,
    { method: "POST" },
  );
  return response.order;
}
