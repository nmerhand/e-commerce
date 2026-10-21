import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import type { CatalogService } from "../src/modules/catalog/catalog.types";

const app = createApp({
  listCategories: async () => [],
  listProducts: async () => ({
    products: [],
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  }),
  findProductBySlug: async () => null,
} satisfies CatalogService);

describe("GET /api/health", () => {
  it("returns the API health status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
