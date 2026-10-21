import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { checkout } from "./api";
import type { OrderSummary, ShippingAddress } from "./types";

const emptyAddress: ShippingAddress = {
  recipientName: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  countryCode: "FR",
};

function formatPrice(price: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading, error, refreshCart } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!user) {
    return (
      <main className="message-page">
        <h1>Connectez-vous avant de passer commande.</h1>
        <Link className="button button-dark" to="/connexion">
          Se connecter
        </Link>
      </main>
    );
  }

  if (order) {
    return (
      <main className="message-page order-confirmation">
        <p className="eyebrow">Commande confirmée</p>
        <h1>Merci pour votre commande.</h1>
        <p>
          Référence <strong>{order.orderNumber}</strong> ·{" "}
          {formatPrice(order.total)}
        </p>
        <p>
          Le paiement a été simulé ; aucune donnée bancaire n’a été utilisée.
        </p>
        <Link className="button button-dark" to="/commandes">
          Voir mes commandes
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="message-page" role="status">
        Chargement de votre panier…
      </main>
    );
  }

  if (error || !cart) {
    return (
      <main className="message-page">
        <h1>Votre panier n’est pas disponible.</h1>
        <p>{error}</p>
        <Link className="button button-dark" to="/panier">
          Retourner au panier
        </Link>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="message-page">
        <h1>Votre panier ne contient aucun article.</h1>
        <Link className="button button-dark" to="/">
          Retourner à la boutique
        </Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const result = await checkout(address);
      setOrder(result.order);
      await refreshCart();
    } catch (reason) {
      setFormError(
        reason instanceof ApiError
          ? reason.message
          : "La commande n’a pas pu être créée.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateAddress(field: keyof ShippingAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="checkout-page">
      <p className="eyebrow">Dernière étape</p>
      <h1>Finaliser la commande</h1>
      <div className="checkout-layout">
        <form className="auth-form checkout-form" onSubmit={handleSubmit}>
          <h2>Adresse de livraison</h2>
          <label>
            <span>Nom du destinataire</span>
            <input
              autoComplete="name"
              maxLength={120}
              minLength={2}
              onChange={(event) =>
                updateAddress("recipientName", event.target.value)
              }
              required
              value={address.recipientName}
            />
          </label>
          <label>
            <span>Adresse</span>
            <input
              autoComplete="address-line1"
              maxLength={200}
              minLength={3}
              onChange={(event) =>
                updateAddress("addressLine1", event.target.value)
              }
              required
              value={address.addressLine1}
            />
          </label>
          <label>
            <span>Complément (facultatif)</span>
            <input
              autoComplete="address-line2"
              maxLength={200}
              onChange={(event) =>
                updateAddress("addressLine2", event.target.value)
              }
              value={address.addressLine2}
            />
          </label>
          <div className="address-row">
            <label>
              <span>Code postal</span>
              <input
                autoComplete="postal-code"
                maxLength={20}
                minLength={3}
                onChange={(event) =>
                  updateAddress("postalCode", event.target.value)
                }
                required
                value={address.postalCode}
              />
            </label>
            <label>
              <span>Ville</span>
              <input
                autoComplete="address-level2"
                maxLength={120}
                minLength={2}
                onChange={(event) => updateAddress("city", event.target.value)}
                required
                value={address.city}
              />
            </label>
          </div>
          <label>
            <span>Pays</span>
            <select
              autoComplete="country"
              onChange={(event) =>
                updateAddress("countryCode", event.target.value)
              }
              value={address.countryCode}
            >
              <option value="FR">France</option>
              <option value="BE">Belgique</option>
              <option value="CH">Suisse</option>
            </select>
          </label>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <button
            className="button button-dark auth-submit"
            disabled={submitting || cart.items.some((item) => !item.available)}
            type="submit"
          >
            {submitting
              ? "Validation en cours…"
              : `Confirmer et payer ${formatPrice(cart.subtotal)}`}
          </button>
          <p className="payment-note">
            Paiement simulé : aucune donnée de carte bancaire n’est demandée.
          </p>
        </form>

        <aside className="cart-summary checkout-summary">
          <h2>Votre commande</h2>
          {cart.items.map((item) => (
            <div className="summary-item" key={item.productId}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <strong>{formatPrice(item.lineTotal)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>{formatPrice(cart.subtotal)}</strong>
          </div>
          <Link className="text-link" to="/panier">
            Modifier mon panier
          </Link>
        </aside>
      </div>
    </main>
  );
}
