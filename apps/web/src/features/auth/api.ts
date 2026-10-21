import { apiRequest, apiRequestWithCsrf } from "../../lib/api";
import type { AuthUser } from "./types";

async function requestAuth<T>(path: string, body: Record<string, string>) {
  return apiRequestWithCsrf<{ user: T }>(path, {
    method: "POST",
    body,
  });
}

export async function loadCurrentUser(signal: AbortSignal) {
  const response = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
    signal,
  });
  return response.user;
}

export async function login(email: string, password: string) {
  const response = await requestAuth<AuthUser>("/api/auth/login", {
    email,
    password,
  });
  return response.user;
}

export async function register(email: string, name: string, password: string) {
  const response = await requestAuth<AuthUser>("/api/auth/register", {
    email,
    name,
    password,
  });
  return response.user;
}

export async function logout() {
  await apiRequestWithCsrf<never>("/api/auth/logout", {
    method: "POST",
  });
}
