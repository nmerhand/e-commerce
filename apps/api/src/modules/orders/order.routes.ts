import { Router } from "express";
import { z } from "zod";
import { requireAuthenticatedUser } from "../auth/auth.middleware";
import type { AuthService } from "../auth/auth.types";
import type { OrderService } from "./order.types";

const shippingAddressSchema = z
  .object({
    recipientName: z.string().trim().min(2).max(120),
    addressLine1: z.string().trim().min(3).max(200),
    addressLine2: z.string().trim().max(200).optional(),
    postalCode: z.string().trim().min(3).max(20),
    city: z.string().trim().min(2).max(120),
    countryCode: z
      .string()
      .trim()
      .length(2)
      .transform((value) => value.toUpperCase()),
  })
  .strict();

const orderNumberSchema = z.string().regex(/^EP-[A-F0-9]{12}$/);

export function createOrderRouter(
  orderService: OrderService,
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

    response.json({ orders: await orderService.listForUser(userId) });
  });

  router.post("/", async (request, response) => {
    const userId = request.authUser?.id;
    const parsed = shippingAddressSchema.safeParse(request.body);

    if (!userId) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid shipping address",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const order = await orderService.checkout(userId, parsed.data);
    response.status(201).json({
      order,
      payment: { mode: "simulated", status: "paid" },
    });
  });

  router.get("/:orderNumber", async (request, response) => {
    const userId = request.authUser?.id;
    const parsedOrderNumber = orderNumberSchema.safeParse(
      request.params.orderNumber,
    );

    if (!userId) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!parsedOrderNumber.success) {
      response.status(400).json({ error: "Invalid order number" });
      return;
    }

    const order = await orderService.findForUser(
      userId,
      parsedOrderNumber.data,
    );

    if (!order) {
      response.status(404).json({ error: "Order not found" });
      return;
    }

    response.json({ order });
  });

  return router;
}
