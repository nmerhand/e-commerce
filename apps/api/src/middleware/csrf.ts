import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const sessionCookieName = isProduction ? "__Host-session" : "session";
export const csrfCookieName = isProduction ? "__Host-csrf" : "csrf";

function matchesToken(cookieToken: unknown, headerToken: string | undefined) {
  if (typeof cookieToken !== "string" || !headerToken) return false;

  const cookieBytes = Buffer.from(cookieToken);
  const headerBytes = Buffer.from(headerToken);

  return (
    cookieBytes.length === headerBytes.length &&
    timingSafeEqual(cookieBytes, headerBytes)
  );
}

export function csrfProtection(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }

  const origin = request.get("origin");
  const allowedOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

  if (origin && origin !== allowedOrigin) {
    response.status(403).json({ error: "Invalid request origin" });
    return;
  }

  if (
    !matchesToken(
      request.cookies?.[csrfCookieName],
      request.get("x-csrf-token"),
    )
  ) {
    response.status(403).json({ error: "CSRF validation failed" });
    return;
  }

  next();
}
