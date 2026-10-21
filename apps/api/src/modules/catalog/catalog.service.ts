import type { CatalogService, ProductRepository } from "./catalog.types";

export function createCatalogService(
  repository: ProductRepository,
): CatalogService {
  return {
    async listProducts(input) {
      const skip = (input.page - 1) * input.limit;
      const { products, total } = await repository.list({
        query: input.query,
        category: input.category,
        skip,
        take: input.limit,
      });

      return {
        products,
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      };
    },
    findProductBySlug(slug) {
      return repository.findBySlug(slug);
    },
  };
}
