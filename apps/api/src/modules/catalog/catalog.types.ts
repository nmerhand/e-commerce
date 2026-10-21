export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ListProductsInput {
  query?: string | undefined;
  category?: string | undefined;
  page: number;
  limit: number;
}

export interface ProductList {
  products: CatalogProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CatalogService {
  listCategories(): Promise<CatalogCategory[]>;
  listProducts(input: ListProductsInput): Promise<ProductList>;
  findProductBySlug(slug: string): Promise<CatalogProduct | null>;
}

export interface ProductRepository {
  listCategories(): Promise<CatalogCategory[]>;
  list(input: {
    query?: string | undefined;
    category?: string | undefined;
    skip: number;
    take: number;
  }): Promise<{ products: CatalogProduct[]; total: number }>;
  findBySlug(slug: string): Promise<CatalogProduct | null>;
}
