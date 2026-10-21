import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, apiRequest } from "../../lib/api";
import { loadCurrentUser, login, logout, register } from "./api";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login(email: string, password: string): Promise<void>;
  register(email: string, name: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function restoreSession() {
      try {
        await apiRequest("/api/auth/csrf", { signal: controller.signal });
        setUser(await loadCurrentUser(controller.signal));
      } catch (reason) {
        if (controller.signal.aborted) return;
        if (reason instanceof ApiError && reason.status === 401) {
          setUser(null);
        } else {
          setError(
            reason instanceof Error
              ? reason.message
              : "L’authentification est momentanément indisponible.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void restoreSession();
    return () => controller.abort();
  }, []);

  const contextValue: AuthContextValue = {
    user,
    loading,
    error,
    async login(email, password) {
      setError(null);
      setUser(await login(email, password));
    },
    async register(email, name, password) {
      setError(null);
      setUser(await register(email, name, password));
    },
    async logout() {
      setError(null);
      try {
        await logout();
        setUser(null);
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : "La déconnexion a échoué.",
        );
      }
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
