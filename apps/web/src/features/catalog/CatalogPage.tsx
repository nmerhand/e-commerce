import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchCategories, fetchProducts } from "./api";
import type { CatalogCategory, CatalogProduct, ProductList } from "./types";

const PAGE_SIZE = 12;

function formatPrice(price: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const [searchInput, setSearchInput] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [listing, setListing] = useState<ProductList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setSearchInput(query);
    setSelectedCategory(category);
  }, [query, category]);

  useEffect(() => {
    const controller = new AbortController();
    const parameters = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    if (query) parameters.set("query", query);
    if (category) parameters.set("category", category);

    setLoading(true);
    setError(false);

    Promise.all([
      fetchProducts(parameters, controller.signal),
      fetchCategories(controller.signal),
    ])
      .then(([productResult, categoryResult]) => {
        setListing(productResult);
        setCategories(categoryResult);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, category, page]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextParams = new URLSearchParams();

    if (searchInput.trim()) nextParams.set("query", searchInput.trim());
    if (selectedCategory) nextParams.set("category", selectedCategory);

    setSearchParams(nextParams);
  }

  function goToPage(nextPage: number) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Des objets pour mieux vivre</p>
          <h1>Le beau, simplement.</h1>
          <p>
            Une sélection d’objets utiles et durables, choisis pour trouver leur
            place chez vous.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-shape hero-shape-one" />
          <span className="hero-shape hero-shape-two" />
          <span className="hero-caption">Maison · Matière · Moment</span>
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Notre collection</p>
            <h2 id="catalog-title">Les essentiels</h2>
          </div>
          {listing && (
            <p className="result-count">
              {listing.total} {listing.total > 1 ? "objets" : "objet"}
            </p>
          )}
        </div>

        <form className="catalog-filters" onSubmit={handleSearch}>
          <label className="search-field">
            <span>Rechercher un objet</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Ex. tasse, vase…"
              maxLength={100}
            />
          </label>
          <label className="category-field">
            <span>Catégorie</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((item: CatalogCategory) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button button-dark filter-button" type="submit">
            Rechercher
          </button>
        </form>

        {loading && (
          <p className="status-message" role="status">
            Chargement de la collection…
          </p>
        )}

        {!loading && error && (
          <div className="status-message error-message" role="alert">
            <p>La collection est momentanément indisponible.</p>
            <button
              className="text-button"
              onClick={() => setSearchParams(new URLSearchParams(searchParams))}
              type="button"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && listing?.products.length === 0 && (
          <div className="empty-state">
            <h3>Aucun objet trouvé</h3>
            <p>Essayez une autre recherche ou parcourez toute la collection.</p>
            <button
              className="text-button"
              onClick={() => {
                setSearchInput("");
                setSelectedCategory("");
                setSearchParams({});
              }}
              type="button"
            >
              Effacer les filtres
            </button>
          </div>
        )}

        {!loading && !error && listing && listing.products.length > 0 && (
          <>
            <div className="product-grid">
              {listing.products.map((product: CatalogProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {listing.totalPages > 1 && (
              <nav className="pagination" aria-label="Pages du catalogue">
                <button
                  className="button button-light"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  type="button"
                >
                  Précédent
                </button>
                <span>
                  Page {page} sur {listing.totalPages}
                </span>
                <button
                  className="button button-light"
                  disabled={page >= listing.totalPages}
                  onClick={() => goToPage(page + 1)}
                  type="button"
                >
                  Suivant
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="product-card">
      <Link
        className="product-image-link"
        to={`/produits/${product.slug}`}
        aria-label={`Découvrir ${product.name}`}
      >
        {product.imageUrl ? (
          <img
            alt=""
            className="product-image"
            loading="lazy"
            src={product.imageUrl}
          />
        ) : (
          <span className="image-placeholder" aria-hidden="true">
            Épure
          </span>
        )}
        <span className="product-category">{product.category.name}</span>
      </Link>
      <div className="product-card-details">
        <Link className="product-name" to={`/produits/${product.slug}`}>
          {product.name}
        </Link>
        <span className="product-price">{formatPrice(product.price)}</span>
      </div>
    </article>
  );
}
