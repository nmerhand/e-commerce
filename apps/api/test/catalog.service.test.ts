import { describe, expect, it, vi } from "vitest";
import { createCatalogService } from "../src/modules/catalog/catalog.service";
import type { ProductRepository } from "../src/modules/catalog/catalog.types";

describe("catalog service", () => {
  it("converts page and limit to repository pagination", async () => {
    const repository: ProductRepository = {
      list: vi.fn().mockResolvedValue({ products: [], total: 23 }),
      findBySlug: vi.fn().mockResolvedValue(null),
    };
    const service = createCatalogService(repository);

    const result = await service.listProducts({
      query: "tasse",
      category: "maison",
      page: 2,
      limit: 10,
    });

    expect(repository.list).toHaveBeenCalledWith({
      query: "tasse",
      category: "maison",
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({
      products: [],
      page: 2,
      limit: 10,
      total: 23,
      totalPages: 3,
    });
  });
});
