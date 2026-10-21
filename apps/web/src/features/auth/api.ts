import { apiRequest } from "../../lib/api";
import type { AuthUser } from "./types";

async function requestWithCsrf<T>(path: string, body?: Record<string, string>) {
  const { csrfToken } = await apiRequest<{ csrfToken: string }>(
    "/api/auth/csrf",
  );

  return apiRequest<{ user: T }>(path, {
    method: "POST",
    body,
    csrfToken,
  });
}

export async function loadCurrentUser(signal: AbortSignal) {
  const response = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
    signal,
  });
  return response.user;
}

export async function login(email: string, password: string) {
  const response = await requestWithCsrf<AuthUser>("/api/auth/login", {
    email,
    password,
  });
  return response.user;
}

export async function register(email: string, name: string, password: string) {
  const response = await requestWithCsrf<AuthUser>("/api/auth/register", {
    email,
    name,
    password,
  });
  return response.user;
}

export async function logout() {
  const { csrfToken } = await apiRequest<{ csrfToken: string }>(
    "/api/auth/csrf",
  );
  await apiRequest<never>("/api/auth/logout", {
    method: "POST",
    csrfToken,
  });
}
