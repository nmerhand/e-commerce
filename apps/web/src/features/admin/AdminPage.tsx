import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  deactivateAdminProduct,
  fetchAdminData,
  saveAdminProduct,
  shipAdminOrder,
} from "./api";
import type {
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminProductInput,
} from "./types";

const emptyProduct: AdminProductInput = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: 0,
  imageUrl: "",
  categoryId: "",
  isActive: true,
};

function formatPrice(price: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function AdminPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [product, setProduct] = useState<AdminProductInput>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();
    fetchAdminData(controller.signal)
      .then((data) => {
        setCategories(data.categories);
        setProducts(data.products);
        setOrders(data.orders);
        setProduct((current) => ({
          ...current,
          categoryId: current.categoryId || data.categories[0]?.id || "",
        }));
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Les données d’administration sont indisponibles.",
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
        <h1>Connectez-vous pour accéder à l’administration.</h1>
        <Link className="button button-dark" to="/connexion">
          Se connecter
        </Link>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main className="message-page">
        <h1>Accès réservé à l’équipe de la boutique.</h1>
        <Link className="text-link" to="/">
          Retourner à la boutique
        </Link>
      </main>
    );
  }

  function setField<K extends keyof AdminProductInput>(
    field: K,
    value: AdminProductInput[K],
  ) {
    setProduct((current) => ({ ...current, [field]: value }));
  }

  function editProduct(item: AdminProduct) {
    setEditingId(item.id);
    setProduct({
      name: item.name,
      slug: item.slug,
      description: item.description,
      price: item.price,
      stock: item.stock,
      imageUrl: item.imageUrl ?? "",
      categoryId: item.category.id,
      isActive: item.isActive,
    });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setProduct({ ...emptyProduct, categoryId: categories[0]?.id ?? "" });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await saveAdminProduct(product, editingId ?? undefined);
      const refreshed = await fetchAdminData(new AbortController().signal);
      setCategories(refreshed.categories);
      setProducts(refreshed.products);
      setOrders(refreshed.orders);
      resetForm();
      setNotice(editingId ? "Produit mis à jour." : "Produit créé.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le produit n’a pas été enregistré.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(item: AdminProduct) {
    if (!window.confirm(`Désactiver le produit « ${item.name} » ?`)) return;
    setError(null);
    setNotice(null);
    try {
      await deactivateAdminProduct(item.id);
      setProducts((current) =>
        current.map((product) =>
          product.id === item.id ? { ...product, isActive: false } : product,
        ),
      );
      setNotice("Produit désactivé ; il reste réactivable.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "La désactivation a échoué.",
      );
    }
  }

  async function handleShip(order: AdminOrder) {
    setError(null);
    setNotice(null);
    try {
      const updated = await shipAdminOrder(order.orderNumber);
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(`La commande ${order.orderNumber} est marquée comme expédiée.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "La commande n’a pas été mise à jour.",
      );
    }
  }

  if (loading) {
    return (
      <main className="message-page" role="status">
        Chargement de l’administration…
      </main>
    );
  }

  return (
    <main className="admin-page">
      <p className="eyebrow">Gestion de la boutique</p>
      <h1>Administration</h1>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}

      <section className="admin-section">
        <h2>{editingId ? "Modifier un produit" : "Ajouter un produit"}</h2>
        {categories.length === 0 ? (
          <p className="form-error">
            Aucune catégorie disponible. Créez-en une avant d’ajouter un
            produit.
          </p>
        ) : (
          <form className="auth-form admin-product-form" onSubmit={handleSave}>
            <label>
              <span>Nom</span>
              <input
                maxLength={160}
                minLength={2}
                onChange={(event) => setField("name", event.target.value)}
                required
                value={product.name}
              />
            </label>
            <label>
              <span>Slug (URL)</span>
              <input
                maxLength={180}
                onChange={(event) =>
                  setField(
                    "slug",
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  )
                }
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                value={product.slug}
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                maxLength={10_000}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
                required
                rows={4}
                value={product.description}
              />
            </label>
            <div className="address-row">
              <label>
                <span>Prix (€)</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setField("price", event.target.value)}
                  pattern="(?:0|[1-9][0-9]{0,7})(?:\.[0-9]{1,2})?"
                  required
                  value={product.price}
                />
              </label>
              <label>
                <span>Stock</span>
                <input
                  max={1_000_000}
                  min={0}
                  onChange={(event) =>
                    setField("stock", Number(event.target.value))
                  }
                  required
                  type="number"
                  value={product.stock}
                />
              </label>
            </div>
            <label>
              <span>URL de l’image (facultative)</span>
              <input
                maxLength={2048}
                onChange={(event) => setField("imageUrl", event.target.value)}
                type="url"
                value={product.imageUrl}
              />
            </label>
            <label>
              <span>Catégorie</span>
              <select
                onChange={(event) => setField("categoryId", event.target.value)}
                required
                value={product.categoryId}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            {editingId && (
              <label className="admin-checkbox">
                <input
                  checked={product.isActive}
                  onChange={(event) =>
                    setField("isActive", event.target.checked)
                  }
                  type="checkbox"
                />
                Produit visible dans la boutique
              </label>
            )}
            <div className="admin-form-actions">
              <button
                className="button button-dark auth-submit"
                disabled={saving || !product.categoryId}
                type="submit"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              {editingId && (
                <button
                  className="text-button"
                  onClick={resetForm}
                  type="button"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="admin-section">
        <h2>Produits ({products.length})</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.slug}</span>
                  </td>
                  <td>{item.category.name}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{item.stock}</td>
                  <td>{item.isActive ? "Publié" : "Désactivé"}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="text-button"
                        onClick={() => editProduct(item)}
                        type="button"
                      >
                        Modifier
                      </button>
                      {item.isActive && (
                        <button
                          className="text-button danger-link"
                          onClick={() => void handleDeactivate(item)}
                          type="button"
                        >
                          Désactiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Commandes ({orders.length})</h2>
        <div className="admin-orders">
          {orders.map((order) => (
            <article className="admin-order" key={order.id}>
              <div>
                <strong>{order.orderNumber}</strong>
                <span>{formatDate(order.createdAt)}</span>
                <span>
                  {order.customer.name} · {order.customer.email}
                </span>
                <span>
                  {order.shippingAddress.recipientName} —{" "}
                  {order.shippingAddress.addressLine1},{" "}
                  {order.shippingAddress.postalCode}{" "}
                  {order.shippingAddress.city}
                </span>
              </div>
              <div className="admin-order-details">
                <strong>{formatPrice(order.total)}</strong>
                <span>
                  {order.status === "PROCESSING"
                    ? "En préparation"
                    : order.status === "SHIPPED"
                      ? "Expédiée"
                      : order.status}
                </span>
                {order.status === "PROCESSING" && (
                  <button
                    className="button button-dark"
                    onClick={() => void handleShip(order)}
                    type="button"
                  >
                    Marquer expédiée
                  </button>
                )}
              </div>
            </article>
          ))}
          {orders.length === 0 && (
            <p className="empty-state">Aucune commande pour le moment.</p>
          )}
        </div>
      </section>
    </main>
  );
}
