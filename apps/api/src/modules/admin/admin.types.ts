import type { OrderStatus } from "../../generated/prisma/client";

export interface ProductInput {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  imageUrl?: string | null | undefined;
  categoryId: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: string; name: string };
}

export interface AdminCategory {
  id: string;
  name: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  total: string;
  createdAt: string;
  customer: { name: string; email: string };
  shippingAddress: {
    recipientName: string;
    addressLine1: string;
    addressLine2: string | null;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  items: { productName: string; quantity: number; unitPrice: string }[];
}

export interface AdminRepository {
  listCategories(): Promise<AdminCategory[]>;
  listProducts(): Promise<AdminProduct[]>;
  createProduct(input: ProductInput): Promise<AdminProduct>;
  updateProduct(
    id: string,
    input: ProductInput & { isActive: boolean },
  ): Promise<AdminProduct>;
  deactivateProduct(id: string): Promise<boolean>;
  listOrders(): Promise<AdminOrder[]>;
  shipOrder(orderNumber: string): Promise<AdminOrder | null>;
}

export interface AdminService {
  listCategories(): Promise<AdminCategory[]>;
  listProducts(): Promise<AdminProduct[]>;
  createProduct(input: ProductInput): Promise<AdminProduct>;
  updateProduct(
    id: string,
    input: ProductInput & { isActive: boolean },
  ): Promise<AdminProduct>;
  deactivateProduct(id: string): Promise<void>;
  listOrders(): Promise<AdminOrder[]>;
  shipOrder(orderNumber: string): Promise<AdminOrder>;
}
