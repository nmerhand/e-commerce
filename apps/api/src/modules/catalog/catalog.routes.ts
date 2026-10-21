import { Router } from "express";
import { z } from "zod";
import type { CatalogService } from "./catalog.types";

const listProductsSchema = z
  .object({
    query: z.string().trim().min(1).max(100).optional(),
    category: z
      .string()
      .trim()
      .min(1)
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();

const productSlugSchema = z
  .string()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export function createCatalogRouter(service: CatalogService) {
  const router = Router();

  router.get("/", async (request, response) => {
    const parsedQuery = listProductsSchema.safeParse(request.query);

    if (!parsedQuery.success) {
      response.status(400).json({
        error: "Invalid query parameters",
        details: parsedQuery.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await service.listProducts(parsedQuery.data);
    response.json(result);
  });

  router.get("/:slug", async (request, response) => {
    const parsedSlug = productSlugSchema.safeParse(request.params.slug);

    if (!parsedSlug.success) {
      response.status(400).json({ error: "Invalid product slug" });
      return;
    }

    const product = await service.findProductBySlug(parsedSlug.data);

    if (!product) {
      response.status(404).json({ error: "Product not found" });
      return;
    }

    response.json({ product });
  });

  return router;
}
