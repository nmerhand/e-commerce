import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, fetchProduct } from "./api";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import type { CatalogProduct } from "./types";

function formatPrice(price: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}

export function ProductPage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not-found" | "unavailable" | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchProduct(slug, controller.signal)
      .then(setProduct)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          reason instanceof ApiError && reason.status === 404
            ? "not-found"
            : "unavailable",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  async function handleAddToCart() {
    if (!product) return;
    setAddingToCart(true);
    setCartMessage(null);

    try {
      await addItem(product.id);
      setCartMessage("Ajouté à votre panier.");
    } catch (reason) {
      setCartMessage(
        reason instanceof Error
          ? reason.message
          : "Le produit n’a pas pu être ajouté.",
      );
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <main className="message-page" role="status">
        Chargement du produit…
      </main>
    );
  }

  if (error === "not-found") {
    return (
      <main className="message-page">
        <p className="eyebrow">Introuvable</p>
        <h1>Ce produit n’est plus disponible.</h1>
        <Link className="text-link" to="/">
          Retourner à la boutique
        </Link>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="message-page" role="alert">
        <h1>Impossible de charger ce produit.</h1>
        <Link className="text-link" to="/">
          Retourner à la boutique
        </Link>
      </main>
    );
  }

  return (
    <main className="product-detail">
      <Link className="text-link back-link" to="/">
        ← Retour à la collection
      </Link>
      <div className="product-detail-grid">
        <div className="product-detail-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <span className="image-placeholder" aria-hidden="true">
              Épure
            </span>
          )}
        </div>
        <section className="product-detail-copy">
          <p className="eyebrow">{product.category.name}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p className="detail-description">{product.description}</p>
          <p className="stock-status">
            {product.stock > 0
              ? `En stock · ${product.stock} disponible${product.stock > 1 ? "s" : ""}`
              : "Actuellement indisponible"}
          </p>
          {user ? (
            <button
              className="button button-dark add-to-cart-button"
              disabled={addingToCart || product.stock < 1}
              onClick={() => void handleAddToCart()}
              type="button"
            >
              {addingToCart
                ? "Ajout en cours…"
                : product.stock > 0
                  ? "Ajouter au panier"
                  : "Indisponible"}
            </button>
          ) : (
            <Link
              className="button button-dark add-to-cart-button"
              to="/connexion"
            >
              Connectez-vous pour commander
            </Link>
          )}
          {cartMessage && (
            <p className="cart-feedback" role="status">
              {cartMessage}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
