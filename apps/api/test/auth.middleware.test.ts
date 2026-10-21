import { describe, expect, it } from "vitest";
import request from "supertest";
import cookieParser from "cookie-parser";
import express from "express";
import {
  requireAuthenticatedUser,
  requireRole,
} from "../src/modules/auth/auth.middleware";
import type { AuthService } from "../src/modules/auth/auth.types";

function createAdminTestApp(role: "CLIENT" | "ADMIN") {
  const authService: AuthService = {
    register: async () => {
      throw new Error("Not used by this test");
    },
    authenticate: async () => null,
    verifySession: async () => ({
      id: "user-1",
      email: "buyer@example.com",
      name: "Buyer",
      role,
    }),
  };
  const app = express();
  app.use(cookieParser());

  app.get(
    "/api/admin-check",
    requireAuthenticatedUser(authService),
    requireRole("ADMIN"),
    (_request, response) => {
      response.status(204).end();
    },
  );

  return app;
}

describe("authentication and role middleware", () => {
  it("rejects requests without a session", async () => {
    const response = await request(createAdminTestApp("ADMIN")).get(
      "/api/admin-check",
    );

    expect(response.status).toBe(401);
  });

  it("rejects client accounts from admin-only routes", async () => {
    const response = await request(createAdminTestApp("CLIENT"))
      .get("/api/admin-check")
      .set("Cookie", "session=test-session");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Insufficient permissions" });
  });

  it("allows administrator accounts through admin-only routes", async () => {
    const response = await request(createAdminTestApp("ADMIN"))
      .get("/api/admin-check")
      .set("Cookie", "session=test-session");

    expect(response.status).toBe(204);
  });
});
