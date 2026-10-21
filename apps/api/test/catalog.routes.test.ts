import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import type {
  CatalogProduct,
  CatalogService,
  ListProductsInput,
  ProductList,
} from "../src/modules/catalog/catalog.types";

const product: CatalogProduct = {
  id: "product-1",
  name: "Tasse en céramique",
  slug: "tasse-ceramique",
  description: "Tasse en céramique émaillée.",
  price: "18.00",
  stock: 24,
  imageUrl: null,
  category: {
    id: "category-1",
    name: "Maison",
    slug: "maison",
  },
};

function createCatalogTestApp() {
  const listProducts = vi.fn(
    async (input: ListProductsInput): Promise<ProductList> => ({
      products: [product],
      page: input.page,
      limit: input.limit,
      total: 1,
      totalPages: 1,
    }),
  );
  const findProductBySlug = vi.fn(
    async (slug: string): Promise<CatalogProduct | null> =>
      slug === product.slug ? product : null,
  );
  const listCategories = vi.fn(async () => [product.category]);
  const service: CatalogService = {
    listCategories,
    listProducts,
    findProductBySlug,
  };

  return {
    app: createApp(service),
    listCategories,
    listProducts,
    findProductBySlug,
  };
}

describe("GET /api/products/categories", () => {
  it("returns categories that have active products", async () => {
    const { app, listCategories } = createCatalogTestApp();
    const response = await request(app).get("/api/products/categories");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ categories: [product.category] });
    expect(listCategories).toHaveBeenCalledOnce();
  });
});

describe("GET /api/products", () => {
  it("returns a filtered page of products", async () => {
    const { app, listProducts } = createCatalogTestApp();
    const response = await request(app).get(
      "/api/products?query=tasse&category=maison&page=2&limit=4",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      products: [product],
      page: 2,
      limit: 4,
      total: 1,
      totalPages: 1,
    });
    expect(listProducts).toHaveBeenCalledWith({
      query: "tasse",
      category: "maison",
      page: 2,
      limit: 4,
    });
  });

  it("rejects invalid pagination parameters", async () => {
    const { app, listProducts } = createCatalogTestApp();
    const response = await request(app).get("/api/products?limit=51");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid query parameters");
    expect(listProducts).not.toHaveBeenCalled();
  });
});

describe("GET /api/products/:slug", () => {
  it("returns the product matching the slug", async () => {
    const { app, findProductBySlug } = createCatalogTestApp();
    const response = await request(app).get("/api/products/tasse-ceramique");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ product });
    expect(findProductBySlug).toHaveBeenCalledWith("tasse-ceramique");
  });

  it("returns 404 when the product does not exist", async () => {
    const { app } = createCatalogTestApp();
    const response = await request(app).get("/api/products/introuvable");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Product not found" });
  });
});
