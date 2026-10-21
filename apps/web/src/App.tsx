import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { ProductPage } from "./features/catalog/ProductPage";

export function App() {
  return (
    <BrowserRouter>
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
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/produits/:slug" element={<ProductPage />} />
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
    </BrowserRouter>
  );
}
