import "dotenv/config";
import { createApp } from "./app";
import { PrismaAuthRepository } from "./modules/auth/auth.repository";
import { createAuthService } from "./modules/auth/auth.service";
import { PrismaCartRepository } from "./modules/cart/cart.repository";
import { createCartService } from "./modules/cart/cart.service";
import { createCatalogService } from "./modules/catalog/catalog.service";
import { PrismaProductRepository } from "./modules/catalog/catalog.repository";
import { PrismaOrderRepository } from "./modules/orders/order.repository";
import { createOrderService } from "./modules/orders/order.service";
import { PrismaAdminRepository } from "./modules/admin/admin.repository";
import { createAdminService } from "./modules/admin/admin.service";

const port = Number(process.env.API_PORT ?? 3000);
const catalogService = createCatalogService(new PrismaProductRepository());
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set before starting the API");
}

const authService = createAuthService(
  new PrismaAuthRepository(),
  sessionSecret,
);
const cartService = createCartService(new PrismaCartRepository());
const orderService = createOrderService(new PrismaOrderRepository());
const adminService = createAdminService(new PrismaAdminRepository());
const app = createApp(
  catalogService,
  authService,
  cartService,
  orderService,
  adminService,
);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
