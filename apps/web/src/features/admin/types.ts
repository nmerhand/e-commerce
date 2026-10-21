export interface AdminCategory {
  id: string;
  name: string;
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
  category: AdminCategory;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
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

export interface AdminProductInput {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string;
  categoryId: string;
  isActive: boolean;
}
