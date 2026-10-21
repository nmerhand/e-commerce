import type { NextFunction, Request, Response } from "express";
import { sessionCookieName } from "../../middleware/csrf";
import type { AuthService, AuthUser, UserRole } from "./auth.types";

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AuthUser;
  }
}

export function requireAuthenticatedUser(service: AuthService) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies?.[sessionCookieName];

    if (!token) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await service.verifySession(token);

    if (!user) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    request.authUser = user;
    next();
  };
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(request.authUser.role)) {
      response.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
