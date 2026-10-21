import { Router } from "express";
import { z } from "zod";
import { requireAuthenticatedUser } from "../auth/auth.middleware";
import type { AuthService } from "../auth/auth.types";
import type { CartService } from "./cart.types";

const addItemSchema = z
  .object({
    productId: z.string().min(1).max(32),
    quantity: z.number().int().min(1).max(99),
  })
  .strict();

const quantitySchema = z
  .object({
    quantity: z.number().int().min(1).max(99),
  })
  .strict();

export function createCartRouter(
  cartService: CartService,
  authService: AuthService,
) {
  const router = Router();
  router.use(requireAuthenticatedUser(authService));

  router.get("/", async (request, response) => {
    const userId = request.authUser?.id;
    if (!userId) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    response.json({ cart: await cartService.getCart(userId) });
  });

  router.post("/items", async (request, response) => {
    const userId = request.authUser?.id;
    const parsed = addItemSchema.safeParse(request.body);

    if (!userId) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid cart item",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const cart = await cartService.addItem(
      userId,
      parsed.data.productId,
      parsed.data.quantity,
    );
    response.status(201).json({ cart });
  });

  router.patch("/items/:productId", async (request, response) => {
    const userId = request.authUser?.id;
    const parsed = quantitySchema.safeParse(request.body);

    if (!userId) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid cart quantity",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const cart = await cartService.setItemQuantity(
      userId,
      request.params.productId,
      parsed.data.quantity,
    );
    response.json({ cart });
  });

  router.delete("/items/:productId", async (request, response) => {
    const userId = request.authUser?.id;
    if (!userId) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    const cart = await cartService.removeItem(userId, request.params.productId);
    response.json({ cart });
  });

  return router;
}
