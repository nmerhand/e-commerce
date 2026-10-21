import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import type { AdminService } from "../src/modules/admin/admin.types";
import type { AuthService, AuthUser } from "../src/modules/auth/auth.types";

const client: AuthUser = {
  id: "client-1",
  email: "client@example.com",
  name: "Client",
  role: "CLIENT",
};

const admin: AuthUser = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN",
};

function createTestApp(user: AuthUser) {
  const adminService: AdminService = {
    listCategories: vi.fn(async () => [{ id: "category-1", name: "Maison" }]),
    listProducts: vi.fn(async () => []),
    createProduct: vi.fn(async (input) => ({
      id: "product-1",
      ...input,
      imageUrl: input.imageUrl ?? null,
      isActive: true,
      category: { id: input.categoryId, name: "Maison" },
    })),
    updateProduct: vi.fn(),
    deactivateProduct: vi.fn(),
    listOrders: vi.fn(async () => []),
    shipOrder: vi.fn(),
  };
  const authService: AuthService = {
    register: async () => ({ user, token: "token" }),
    authenticate: async () => null,
    verifySession: async () => user,
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
    app: createApp(
      catalogService,
      authService,
      undefined,
      undefined,
      adminService,
    ),
    adminService,
  };
}

describe("admin endpoints", () => {
  it("rejects clients", async () => {
    const { app } = createTestApp(client);
    const response = await request(app)
      .get("/api/admin/products")
      .set("Cookie", "session=test-session");

    expect(response.status).toBe(403);
  });

  it("returns admin categories", async () => {
    const { app } = createTestApp(admin);
    const response = await request(app)
      .get("/api/admin/categories")
      .set("Cookie", "session=test-session");

    expect(response.status).toBe(200);
    expect(response.body.categories).toEqual([
      { id: "category-1", name: "Maison" },
    ]);
  });

  it("validates and creates products", async () => {
    const { app, adminService } = createTestApp(admin);
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    const response = await agent
      .post("/api/admin/products")
      .set("Cookie", "session=test-session")
      .set("x-csrf-token", csrf.body.csrfToken)
      .send({
        name: "Vase",
        slug: "vase",
        description: "Vase en céramique",
        price: "24.90",
        stock: 4,
        categoryId: "category-1",
      });

    expect(response.status).toBe(201);
    expect(response.body.product.slug).toBe("vase");
    expect(adminService.createProduct).toHaveBeenCalledWith({
      name: "Vase",
      slug: "vase",
      description: "Vase en céramique",
      price: "24.90",
      stock: 4,
      imageUrl: null,
      categoryId: "category-1",
    });
  });

  it("rejects invalid product data", async () => {
    const { app, adminService } = createTestApp(admin);
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    const response = await agent
      .post("/api/admin/products")
      .set("Cookie", "session=test-session")
      .set("x-csrf-token", csrf.body.csrfToken)
      .send({ name: "Invalid", slug: "UPPER", price: "-1" });

    expect(response.status).toBe(400);
    expect(adminService.createProduct).not.toHaveBeenCalled();
  });
});
