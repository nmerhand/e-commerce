export interface ShippingAddress {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string | undefined;
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

export interface OrderRepository {
  checkout(userId: string, address: ShippingAddress): Promise<OrderSummary>;
  listForUser(userId: string): Promise<OrderSummary[]>;
  findForUser(
    userId: string,
    orderNumber: string,
  ): Promise<OrderSummary | null>;
}

export interface OrderService {
  checkout(userId: string, address: ShippingAddress): Promise<OrderSummary>;
  listForUser(userId: string): Promise<OrderSummary[]>;
  findForUser(
    userId: string,
    orderNumber: string,
  ): Promise<OrderSummary | null>;
}
