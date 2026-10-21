import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "./CartContext";
import type { CartItem } from "./types";

function formatPrice(price: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}

export function CartPage() {
  const { user } = useAuth();
  const { cart, loading, error, setQuantity, removeItem } = useCart();
  const [actionError, setActionError] = useState<string | null>(null);

  if (!user) {
    return (
      <main className="message-page">
        <h1>Connectez-vous pour retrouver votre panier.</h1>
        <Link className="button button-dark" to="/connexion">
          Se connecter
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="message-page" role="status">
        Chargement du panier…
      </main>
    );
  }

  if (error || !cart) {
    return (
      <main className="message-page" role="alert">
        <h1>Le panier n’a pas pu être chargé.</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="message-page">
        <p className="eyebrow">Votre sélection</p>
        <h1>Votre panier est vide.</h1>
        <Link className="button button-dark" to="/">
          Découvrir la collection
        </Link>
      </main>
    );
  }

  const canCheckout = cart.items.every((item) => item.available);

  async function handleAction(action: () => Promise<void>) {
    setActionError(null);
    try {
      await action();
    } catch (reason) {
      setActionError(
        reason instanceof Error ? reason.message : "La modification a échoué.",
      );
    }
  }

  return (
    <main className="cart-page">
      <p className="eyebrow">Votre sélection</p>
      <h1>Le panier</h1>
      {(actionError || error) && (
        <p className="form-error" role="alert">
          {actionError ?? error}
        </p>
      )}

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map((item: CartItem) => (
            <article className="cart-item" key={item.productId}>
              <Link
                className="cart-item-image"
                to={`/produits/${item.slug}`}
                aria-label={`Voir ${item.name}`}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" />
                ) : (
                  <span className="image-placeholder">Épure</span>
                )}
              </Link>
              <div className="cart-item-info">
                <Link className="product-name" to={`/produits/${item.slug}`}>
                  {item.name}
                </Link>
                <span>{formatPrice(item.price)}</span>
                {!item.available && (
                  <span className="form-error">
                    Quantité ou disponibilité à vérifier.
                  </span>
                )}
                <div
                  className="quantity-controls"
                  aria-label={`Quantité de ${item.name}`}
                >
                  <button
                    aria-label={`Retirer une unité de ${item.name}`}
                    disabled={item.quantity <= 1}
                    onClick={() =>
                      void handleAction(() =>
                        setQuantity(item.productId, item.quantity - 1),
                      )
                    }
                    type="button"
                  >
                    −
                  </button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button
                    aria-label={`Ajouter une unité de ${item.name}`}
                    disabled={
                      item.quantity >= item.stock || item.quantity >= 99
                    }
                    onClick={() =>
                      void handleAction(() =>
                        setQuantity(item.productId, item.quantity + 1),
                      )
                    }
                    type="button"
                  >
                    +
                  </button>
                  <button
                    className="remove-item"
                    onClick={() =>
                      void handleAction(() => removeItem(item.productId))
                    }
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <strong className="cart-line-total">
                {formatPrice(item.lineTotal)}
              </strong>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Récapitulatif</h2>
          <div>
            <span>Sous-total</span>
            <strong>{formatPrice(cart.subtotal)}</strong>
          </div>
          <p>Les frais de livraison seront confirmés à l’étape suivante.</p>
          {!canCheckout && (
            <p className="form-error">
              Retirez ou corrigez les articles indisponibles avant de commander.
            </p>
          )}
          <Link
            className={`button button-dark checkout-link${canCheckout ? "" : " disabled-link"}`}
            aria-disabled={!canCheckout}
            tabIndex={canCheckout ? 0 : -1}
            onClick={(event) => {
              if (!canCheckout) event.preventDefault();
            }}
            to="/commande"
          >
            Passer commande
          </Link>
          <Link className="text-link continue-shopping" to="/">
            Continuer mes achats
          </Link>
        </aside>
      </div>
    </main>
  );
}
