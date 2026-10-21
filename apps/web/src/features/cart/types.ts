export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: string;
  quantity: number;
  stock: number;
  imageUrl: string | null;
  available: boolean;
  lineTotal: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: string;
}
