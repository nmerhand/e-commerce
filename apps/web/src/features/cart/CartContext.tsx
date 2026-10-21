import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../auth/AuthContext";
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from "./api";
import type { Cart } from "./types";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  refreshCart(): Promise<void>;
  addItem(productId: string, quantity?: number): Promise<void>;
  setQuantity(productId: string, quantity: number): Promise<void>;
  removeItem(productId: string): Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshCart() {
    if (!user) {
      setCart(null);
      return;
    }

    setError(null);
    setCart(await fetchCart());
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchCart(controller.signal)
      .then(setCart)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          reason instanceof ApiError
            ? reason.message
            : "Le panier est momentanément indisponible.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user, authLoading]);

  const value: CartContextValue = {
    cart,
    loading: loading || authLoading,
    error,
    async refreshCart() {
      try {
        await refreshCart();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Le panier n’a pas pu être actualisé.",
        );
        throw reason;
      }
    },
    async addItem(productId, quantity = 1) {
      setError(null);
      try {
        setCart(await addCartItem(productId, quantity));
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Le produit n’a pas pu être ajouté.",
        );
        throw reason;
      }
    },
    async setQuantity(productId, quantity) {
      setError(null);
      try {
        setCart(await updateCartItem(productId, quantity));
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "La quantité n’a pas pu être modifiée.",
        );
        throw reason;
      }
    },
    async removeItem(productId) {
      setError(null);
      try {
        setCart(await removeCartItem(productId));
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Le produit n’a pas pu être supprimé.",
        );
        throw reason;
      }
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
