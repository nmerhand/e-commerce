import { Router } from "express";
import { z } from "zod";
import { requireAuthenticatedUser, requireRole } from "../auth/auth.middleware";
import type { AuthService } from "../auth/auth.types";
import type { AdminService } from "./admin.types";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const productSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: slugSchema,
    description: z.string().trim().min(1).max(10_000),
    price: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/)
      .refine((value) => Number(value) > 0),
    stock: z.number().int().min(0).max(1_000_000),
    imageUrl: z
      .string()
      .trim()
      .max(2048)
      .url()
      .refine((value) => {
        try {
          return ["http:", "https:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      })
      .nullable()
      .optional()
      .or(z.literal("")),
    categoryId: z.string().min(1).max(30),
  })
  .strict();

const productUpdateSchema = productSchema.extend({
  isActive: z.boolean(),
});

const productIdSchema = z.string().min(1).max(30);
const orderNumberSchema = z.string().regex(/^EP-[A-F0-9]{12}$/);

export function createAdminRouter(
  service: AdminService,
  authService: AuthService,
) {
  const router = Router();
  router.use(requireAuthenticatedUser(authService), requireRole("ADMIN"));

  router.get("/categories", async (_request, response) => {
    response.json({ categories: await service.listCategories() });
  });

  router.get("/products", async (_request, response) => {
    response.json({ products: await service.listProducts() });
  });

  router.post("/products", async (request, response) => {
    const parsed = productSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid product",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const product = await service.createProduct({
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null,
    });
    response.status(201).json({ product });
  });

  router.put("/products/:id", async (request, response) => {
    const parsedId = productIdSchema.safeParse(request.params.id);
    const parsedProduct = productUpdateSchema.safeParse(request.body);
    if (!parsedId.success || !parsedProduct.success) {
      response.status(400).json({
        error: "Invalid product",
        details: parsedProduct.success
          ? { id: ["Invalid product id"] }
          : parsedProduct.error.flatten().fieldErrors,
      });
      return;
    }

    const product = await service.updateProduct(parsedId.data, {
      ...parsedProduct.data,
      imageUrl: parsedProduct.data.imageUrl || null,
    });
    response.json({ product });
  });

  router.delete("/products/:id", async (request, response) => {
    const parsedId = productIdSchema.safeParse(request.params.id);
    if (!parsedId.success) {
      response.status(400).json({ error: "Invalid product id" });
      return;
    }
    await service.deactivateProduct(parsedId.data);
    response.status(204).end();
  });

  router.get("/orders", async (_request, response) => {
    response.json({ orders: await service.listOrders() });
  });

  router.post("/orders/:orderNumber/ship", async (request, response) => {
    const parsedOrderNumber = orderNumberSchema.safeParse(
      request.params.orderNumber,
    );
    if (!parsedOrderNumber.success) {
      response.status(400).json({ error: "Invalid order number" });
      return;
    }
    response.json({
      order: await service.shipOrder(parsedOrderNumber.data),
    });
  });

  return router;
}
