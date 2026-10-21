import { randomBytes } from "node:crypto";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { csrfCookieName, sessionCookieName } from "../../middleware/csrf";
import { EmailAlreadyRegisteredError } from "./auth.errors";
import type { AuthService } from "./auth.types";

const sessionMaxAge = 30 * 60 * 1000;
const secureCookies = process.env.NODE_ENV === "production";
const sessionCookieAttributes = {
  httpOnly: true,
  secure: secureCookies,
  sameSite: "lax" as const,
  path: "/",
};
const csrfCookieAttributes = {
  httpOnly: false,
  secure: secureCookies,
  sameSite: "strict" as const,
  path: "/",
};
const authenticationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." },
});

const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(12).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export function createAuthRouter(service: AuthService) {
  const router = Router();

  router.get("/csrf", (_request, response) => {
    const csrfToken = randomBytes(32).toString("base64url");
    response.cookie(csrfCookieName, csrfToken, {
      ...csrfCookieAttributes,
      maxAge: sessionMaxAge,
    });
    response.json({ csrfToken });
  });

  router.post(
    "/register",
    authenticationRateLimit,
    async (request, response) => {
      const parsed = registerSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Invalid registration details",
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      try {
        const result = await service.register(parsed.data);
        response.cookie(sessionCookieName, result.token, {
          ...sessionCookieAttributes,
          maxAge: sessionMaxAge,
        });
        response.status(201).json({ user: result.user });
      } catch (error) {
        if (error instanceof EmailAlreadyRegisteredError) {
          response.status(409).json({ error: "An account already exists" });
          return;
        }

        throw error;
      }
    },
  );

  router.post("/login", authenticationRateLimit, async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid login details",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await service.authenticate(
      parsed.data.email,
      parsed.data.password,
    );

    if (!result) {
      response.status(401).json({ error: "Invalid email or password" });
      return;
    }

    response.cookie(sessionCookieName, result.token, {
      ...sessionCookieAttributes,
      maxAge: sessionMaxAge,
    });
    response.json({ user: result.user });
  });

  router.post("/logout", (_request, response) => {
    response.clearCookie(sessionCookieName, sessionCookieAttributes);
    response.clearCookie(csrfCookieName, csrfCookieAttributes);
    response.status(204).end();
  });

  router.get("/me", async (request, response) => {
    const token = request.cookies?.[sessionCookieName];

    if (!token) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await service.verifySession(token);

    if (!user) {
      response.clearCookie(sessionCookieName, sessionCookieAttributes);
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    response.json({ user });
  });

  return router;
}
