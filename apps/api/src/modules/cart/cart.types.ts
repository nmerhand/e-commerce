export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
}

export interface CartItemRecord {
  productId: string;
  quantity: number;
  product: CartProduct;
}

export interface CartRecord {
  id: string;
  items: CartItemRecord[];
}

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

export interface CartRepository {
  getCart(userId: string): Promise<CartRecord>;
  findProduct(productId: string): Promise<CartProduct | null>;
  findItemQuantity(cartId: string, productId: string): Promise<number | null>;
  saveItem(cartId: string, productId: string, quantity: number): Promise<void>;
  setItemQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<boolean>;
  removeItem(cartId: string, productId: string): Promise<boolean>;
}

export interface CartService {
  getCart(userId: string): Promise<Cart>;
  addItem(userId: string, productId: string, quantity: number): Promise<Cart>;
  setItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart>;
  removeItem(userId: string, productId: string): Promise<Cart>;
}
