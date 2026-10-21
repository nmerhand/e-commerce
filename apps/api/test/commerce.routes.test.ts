import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import type { AuthService, AuthUser } from "../src/modules/auth/auth.types";
import type { Cart, CartService } from "../src/modules/cart/cart.types";
import type {
  OrderService,
  OrderSummary,
  ShippingAddress,
} from "../src/modules/orders/order.types";

const user: AuthUser = {
  id: "user-1",
  email: "buyer@example.com",
  name: "Buyer",
  role: "CLIENT",
};

const cart: Cart = {
  items: [],
  totalItems: 0,
  subtotal: "0.00",
};

const order: OrderSummary = {
  id: "order-1",
  orderNumber: "EP-0123456789AB",
  total: "18.50",
  status: "PROCESSING",
  paymentStatus: "PAID",
  createdAt: "2026-10-21T10:00:00.000Z",
  items: [{ productName: "Tasse", unitPrice: "18.50", quantity: 1 }],
};

function createCommerceTestApp() {
  const authService: AuthService = {
    register: async () => ({ user, token: "token" }),
    authenticate: async () => null,
    verifySession: async () => user,
  };
  const cartService: CartService = {
    getCart: vi.fn(async () => cart),
    addItem: vi.fn(async () => cart),
    setItemQuantity: vi.fn(async () => cart),
    removeItem: vi.fn(async () => cart),
  };
  const orderService: OrderService = {
    checkout: vi.fn(async () => order),
    listForUser: vi.fn(async () => [order]),
    findForUser: vi.fn(async () => order),
  };
  const catalogService = {
    listCategories: async () => [],
    listProducts: async () => ({
      products: [],
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    }),
    findProductBySlug: async () => null,
  };

  return {
    app: createApp(catalogService, authService, cartService, orderService),
    cartService,
    orderService,
  };
}

async function createAgentWithCsrf(
  app: ReturnType<typeof createCommerceTestApp>["app"],
) {
  const agent = request.agent(app);
  const response = await agent.get("/api/auth/csrf");
  return { agent, csrfToken: response.body.csrfToken as string };
}

describe("cart endpoints", () => {
  it("requires authentication", async () => {
    const { app } = createCommerceTestApp();
    const response = await request(app).get("/api/cart");

    expect(response.status).toBe(401);
  });

  it("returns a signed-in user's cart", async () => {
    const { app } = createCommerceTestApp();
    const response = await request(app)
      .get("/api/cart")
      .set("Cookie", "session=test-session");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ cart });
  });

  it("validates and adds cart item quantities", async () => {
    const { app, cartService } = createCommerceTestApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post("/api/cart/items")
      .set("Cookie", "session=test-session")
      .set("x-csrf-token", csrfToken)
      .send({ productId: "product-1", quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ cart });
    expect(cartService.addItem).toHaveBeenCalledWith(user.id, "product-1", 2);
  });

  it("rejects invalid cart item quantities", async () => {
    const { app, cartService } = createCommerceTestApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post("/api/cart/items")
      .set("Cookie", "session=test-session")
      .set("x-csrf-token", csrfToken)
      .send({ productId: "product-1", quantity: 0 });

    expect(response.status).toBe(400);
    expect(cartService.addItem).not.toHaveBeenCalled();
  });
});

describe("order endpoints", () => {
  const address: ShippingAddress = {
    recipientName: "Buyer",
    addressLine1: "1 rue des Fleurs",
    postalCode: "75001",
    city: "Paris",
    countryCode: "FR",
  };

  it("creates an order using server-calculated amounts and simulated payment", async () => {
    const { app, orderService } = createCommerceTestApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post("/api/orders")
      .set("Cookie", "session=test-session")
      .set("x-csrf-token", csrfToken)
      .send(address);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      order,
      payment: { mode: "simulated", status: "paid" },
    });
    expect(orderService.checkout).toHaveBeenCalledWith(user.id, address);
  });

  it("rejects invalid shipping addresses", async () => {
    const { app, orderService } = createCommerceTestApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post("/api/orders")
      .set("Cookie", "session=test-session")
      .set("x-csrf-token", csrfToken)
      .send({ ...address, countryCode: "France" });

    expect(response.status).toBe(400);
    expect(orderService.checkout).not.toHaveBeenCalled();
  });

  it("only returns orders belonging to the authenticated user", async () => {
    const { app, orderService } = createCommerceTestApp();
    const response = await request(app)
      .get("/api/orders/EP-0123456789AB")
      .set("Cookie", "session=test-session");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ order });
    expect(orderService.findForUser).toHaveBeenCalledWith(
      user.id,
      order.orderNumber,
    );
  });
});
