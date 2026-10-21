import { apiRequest } from "../../lib/api";
import type { CatalogCategory, CatalogProduct, ProductList } from "./types";

export { ApiError } from "../../lib/api";

export function fetchProducts(
  parameters: URLSearchParams,
  signal: AbortSignal,
) {
  return apiRequest<ProductList>(`/api/products?${parameters.toString()}`, {
    signal,
  });
}

export async function fetchCategories(signal: AbortSignal) {
  const response = await apiRequest<{ categories: CatalogCategory[] }>(
    "/api/products/categories",
    { signal },
  );
  return response.categories;
}

export async function fetchProduct(slug: string, signal: AbortSignal) {
  const response = await apiRequest<{ product: CatalogProduct }>(
    `/api/products/${encodeURIComponent(slug)}`,
    { signal },
  );
  return response.product;
}
