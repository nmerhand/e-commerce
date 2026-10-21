import { Prisma } from "../../generated/prisma/client";
import { HttpError } from "../../lib/http-error";
import { prisma } from "../../lib/prisma";
import type {
  AdminOrder,
  AdminProduct,
  AdminRepository,
  ProductInput,
} from "./admin.types";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  stock: true,
  imageUrl: true,
  isActive: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.ProductSelect;

const orderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  total: true,
  createdAt: true,
  user: { select: { name: true, email: true } },
  recipientName: true,
  shippingAddressLine1: true,
  shippingAddressLine2: true,
  shippingPostalCode: true,
  shippingCity: true,
  shippingCountryCode: true,
  items: {
    select: { productName: true, quantity: true, unitPrice: true },
  },
} satisfies Prisma.OrderSelect;

type ProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>;
type OrderRecord = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

function toProduct(product: ProductRecord): AdminProduct {
  return { ...product, price: product.price.toFixed(2) };
}

function toOrder(order: OrderRecord): AdminOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total.toFixed(2),
    createdAt: order.createdAt.toISOString(),
    customer: order.user,
    shippingAddress: {
      recipientName: order.recipientName,
      addressLine1: order.shippingAddressLine1,
      addressLine2: order.shippingAddressLine2,
      postalCode: order.shippingPostalCode,
      city: order.shippingCity,
      countryCode: order.shippingCountryCode,
    },
    items: order.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toFixed(2),
    })),
  };
}

function productData(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: new Prisma.Decimal(input.price),
    stock: input.stock,
    imageUrl: input.imageUrl ?? null,
    categoryId: input.categoryId,
  };
}

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new HttpError(409, "A product with this slug already exists");
    }
    if (error.code === "P2003") {
      throw new HttpError(400, "The selected category does not exist");
    }
    if (error.code === "P2025") {
      throw new HttpError(404, "Product not found");
    }
  }
  throw error;
}

export class PrismaAdminRepository implements AdminRepository {
  listCategories() {
    return prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async listProducts() {
    const products = await prisma.product.findMany({
      select: productSelect,
      orderBy: { name: "asc" },
    });
    return products.map(toProduct);
  }

  async createProduct(input: ProductInput) {
    try {
      return toProduct(
        await prisma.product.create({
          data: productData(input),
          select: productSelect,
        }),
      );
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async updateProduct(id: string, input: ProductInput & { isActive: boolean }) {
    try {
      return toProduct(
        await prisma.product.update({
          where: { id },
          data: { ...productData(input), isActive: input.isActive },
          select: productSelect,
        }),
      );
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async deactivateProduct(id: string) {
    const result = await prisma.product.updateMany({
      where: { id },
      data: { isActive: false },
    });
    return result.count === 1;
  }

  async listOrders() {
    const orders = await prisma.order.findMany({
      select: orderSelect,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return orders.map(toOrder);
  }

  async shipOrder(orderNumber: string) {
    const result = await prisma.order.updateMany({
      where: { orderNumber, status: "PROCESSING" },
      data: { status: "SHIPPED" },
    });
    if (result.count !== 1) return null;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: orderSelect,
    });
    return order ? toOrder(order) : null;
  }
}
