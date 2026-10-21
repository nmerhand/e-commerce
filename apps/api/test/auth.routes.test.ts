import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import type { AuthService, AuthUser } from "../src/modules/auth/auth.types";

const user: AuthUser = {
  id: "user-1",
  email: "buyer@example.com",
  name: "Buyer",
  role: "CLIENT",
};

function createAuthTestApp() {
  const authService: AuthService = {
    register: vi.fn(async () => ({ user, token: "signed-session" })),
    authenticate: vi.fn(async () => null),
    verifySession: vi.fn(async () => user),
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
    app: createApp(catalogService, authService),
    authService,
  };
}

async function getCsrfToken(agent: ReturnType<typeof request.agent>) {
  const response = await agent.get("/api/auth/csrf");
  expect(response.status).toBe(200);
  return response.body.csrfToken as string;
}

describe("authentication routes", () => {
  it("blocks state-changing requests without a CSRF token", async () => {
    const { app } = createAuthTestApp();
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "CSRF validation failed" });
  });

  it("validates registration and sets an HttpOnly session cookie", async () => {
    const { app, authService } = createAuthTestApp();
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const response = await agent
      .post("/api/auth/register")
      .set("x-csrf-token", csrfToken)
      .send({
        email: "buyer@example.com",
        name: "Buyer",
        password: "a-very-secure-password",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ user });
    expect(authService.register).toHaveBeenCalledOnce();
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("session=signed-session"),
        expect.stringContaining("HttpOnly"),
      ]),
    );
  });

  it("rejects malformed registration input", async () => {
    const { app, authService } = createAuthTestApp();
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const response = await agent
      .post("/api/auth/register")
      .set("x-csrf-token", csrfToken)
      .send({ email: "not-an-email", name: "B", password: "short" });

    expect(response.status).toBe(400);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("uses a generic error for invalid credentials", async () => {
    const { app } = createAuthTestApp();
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const response = await agent
      .post("/api/auth/login")
      .set("x-csrf-token", csrfToken)
      .send({ email: "buyer@example.com", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "Invalid email or password",
    });
  });

  it("requires a valid session to read the current user", async () => {
    const { app } = createAuthTestApp();
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
  });
});
