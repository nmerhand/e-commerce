import type { CatalogCategory, CatalogProduct, ProductList } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new ApiError("La requête n’a pas abouti.", response.status);
  }

  return (await response.json()) as T;
}

export function fetchProducts(
  parameters: URLSearchParams,
  signal: AbortSignal,
) {
  return request<ProductList>(`/api/products?${parameters.toString()}`, signal);
}

export async function fetchCategories(signal: AbortSignal) {
  const response = await request<{ categories: CatalogCategory[] }>(
    "/api/products/categories",
    signal,
  );
  return response.categories;
}

export async function fetchProduct(slug: string, signal: AbortSignal) {
  const response = await request<{ product: CatalogProduct }>(
    `/api/products/${encodeURIComponent(slug)}`,
    signal,
  );
  return response.product;
}
