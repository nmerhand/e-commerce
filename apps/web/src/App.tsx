import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { AuthPage } from "./features/auth/AuthPage";
import { AdminPage } from "./features/admin/AdminPage";
import { CartPage } from "./features/cart/CartPage";
import { CartProvider, useCart } from "./features/cart/CartContext";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { ProductPage } from "./features/catalog/ProductPage";
import { CheckoutPage } from "./features/orders/CheckoutPage";
import { OrderHistoryPage } from "./features/orders/OrderHistoryPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SiteLayout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function SiteLayout() {
  const { user, loading, error, logout } = useAuth();
  const { cart } = useCart();

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>Épure</span>
        </Link>
        <nav aria-label="Navigation principale">
          <Link to="/">La boutique</Link>
          <Link to="/panier">
            Panier{cart && cart.totalItems > 0 ? ` (${cart.totalItems})` : ""}
          </Link>
          {!loading &&
            (user ? (
              <div className="account-nav">
                <Link to="/commandes">Commandes</Link>
                {user.role === "ADMIN" && (
                  <Link to="/admin">Administration</Link>
                )}
                <span className="account-name">{user.name}</span>
                <button className="text-button" onClick={() => void logout()}>
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link to="/connexion">Connexion</Link>
            ))}
        </nav>
      </header>

      {error && (
        <p className="site-alert" role="alert">
          {error}
        </p>
      )}

      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/produits/:slug" element={<ProductPage />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/commande" element={<CheckoutPage />} />
        <Route path="/commandes" element={<OrderHistoryPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/connexion" element={<AuthPage mode="login" />} />
        <Route path="/inscription" element={<AuthPage mode="register" />} />
        <Route
          path="*"
          element={
            <main className="message-page">
              <h1>Cette page n’existe pas</h1>
              <Link className="text-link" to="/">
                Retourner à la boutique
              </Link>
            </main>
          }
        />
      </Routes>

      <footer className="site-footer">
        <span>Épure — objets choisis pour le quotidien.</span>
        <span>Paiement simulé · Livraison en France</span>
      </footer>
    </div>
  );
}
