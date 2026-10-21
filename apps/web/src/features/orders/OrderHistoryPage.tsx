import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../lib/api";
import { useAuth } from "../auth/AuthContext";
import { fetchOrders } from "./api";
import type { OrderSummary } from "./types";

function formatPrice(price: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function formatOrderStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "PROCESSING":
      return "En préparation";
    case "SHIPPED":
      return "Expédiée";
    case "CANCELLED":
      return "Annulée";
    default:
      return status;
  }
}

export function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchOrders(controller.signal)
      .then(setOrders)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          reason instanceof ApiError
            ? reason.message
            : "Les commandes ne sont pas disponibles.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  if (!user) {
    return (
      <main className="message-page">
        <h1>Connectez-vous pour voir vos commandes.</h1>
        <Link className="button button-dark" to="/connexion">
          Se connecter
        </Link>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <p className="eyebrow">Votre compte</p>
      <h1>Mes commandes</h1>
      {loading && <p role="status">Chargement des commandes…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <p>Vous n’avez pas encore passé de commande.</p>
          <Link className="text-link" to="/">
            Découvrir la collection
          </Link>
        </div>
      )}
      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div>
              <p className="eyebrow">{formatDate(order.createdAt)}</p>
              <h2>{order.orderNumber}</h2>
              <p>
                {order.items
                  .map((item) => `${item.productName} × ${item.quantity}`)
                  .join(", ")}
              </p>
            </div>
            <div className="order-status">
              <strong>{formatPrice(order.total)}</strong>
              <span>{formatOrderStatus(order.status)}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
