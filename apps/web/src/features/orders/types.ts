import type { CartItem } from "../cart/types";

export interface ShippingAddress {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  countryCode: string;
}

export interface OrderItem {
  productName: string;
  unitPrice: string;
  quantity: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

export type CheckoutCartItem = CartItem;
