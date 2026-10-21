import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { HttpError } from "./lib/http-error";
import { createAuthRouter } from "./modules/auth/auth.routes";
import type { AuthService } from "./modules/auth/auth.types";
import { createCartRouter } from "./modules/cart/cart.routes";
import type { CartService } from "./modules/cart/cart.types";
import { createCatalogRouter } from "./modules/catalog/catalog.routes";
import type { CatalogService } from "./modules/catalog/catalog.types";
import { csrfProtection } from "./middleware/csrf";
import { createOrderRouter } from "./modules/orders/order.routes";
import type { OrderService } from "./modules/orders/order.types";
import { createAdminRouter } from "./modules/admin/admin.routes";
import type { AdminService } from "./modules/admin/admin.types";

export function createApp(
  catalogService: CatalogService,
  authService?: AuthService,
  cartService?: CartService,
  orderService?: OrderService,
  adminService?: AdminService,
) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use("/api", csrfProtection);

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/api/products", createCatalogRouter(catalogService));
  if (authService) {
    app.use("/api/auth", createAuthRouter(authService));
  }
  if (authService && cartService) {
    app.use("/api/cart", createCartRouter(cartService, authService));
  }
  if (authService && orderService) {
    app.use("/api/orders", createOrderRouter(orderService, authService));
  }
  if (authService && adminService) {
    app.use("/api/admin", createAdminRouter(adminService, authService));
  }
  app.use((_request, response) => {
    response.status(404).json({ error: "Route not found" });
  });
  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      if (response.headersSent) {
        next(error);
        return;
      }

      if (error instanceof HttpError) {
        response.status(error.statusCode).json({ error: error.message });
        return;
      }

      console.error("Unhandled API error", error);
      response.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
