export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  category: CatalogCategory;
}

export interface ProductList {
  products: CatalogProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
