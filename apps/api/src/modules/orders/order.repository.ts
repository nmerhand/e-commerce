import { randomBytes } from "node:crypto";
import { Prisma } from "../../generated/prisma/client";
import { HttpError } from "../../lib/http-error";
import { fromCents, toCents } from "../../lib/money";
import { prisma } from "../../lib/prisma";
import type {
  OrderRepository,
  OrderSummary,
  ShippingAddress,
} from "./order.types";

const orderSelect = {
  id: true,
  orderNumber: true,
  total: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
  items: {
    select: {
      productName: true,
      unitPrice: true,
      quantity: true,
    },
  },
} as const;

type OrderRecord = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

function toOrderSummary(order: OrderRecord): OrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total.toFixed(2),
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toFixed(2),
    })),
  };
}

export class PrismaOrderRepository implements OrderRepository {
  async checkout(userId: string, address: ShippingAddress) {
    const order = await prisma.$transaction(async (transaction) => {
      const cart = await transaction.cart.findUnique({
        where: { userId },
        select: {
          id: true,
          items: {
            select: {
              productId: true,
              quantity: true,
              product: {
                select: {
                  name: true,
                  price: true,
                  stock: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!cart?.items.length) {
        throw new HttpError(400, "The cart is empty");
      }

      let totalCents = 0;

      for (const item of cart.items) {
        if (!item.product.isActive || item.product.stock < item.quantity) {
          throw new HttpError(
            409,
            `Insufficient stock for ${item.product.name}`,
          );
        }

        const stockUpdate = await transaction.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (stockUpdate.count !== 1) {
          throw new HttpError(
            409,
            `Insufficient stock for ${item.product.name}`,
          );
        }

        totalCents += toCents(item.product.price.toFixed(2)) * item.quantity;
      }

      const orderNumber = `EP-${randomBytes(6).toString("hex").toUpperCase()}`;
      const createdOrder = await transaction.order.create({
        data: {
          orderNumber,
          userId,
          status: "PROCESSING",
          paymentStatus: "PAID",
          total: new Prisma.Decimal(fromCents(totalCents)),
          recipientName: address.recipientName,
          shippingAddressLine1: address.addressLine1,
          shippingAddressLine2: address.addressLine2 ?? null,
          shippingPostalCode: address.postalCode,
          shippingCity: address.city,
          shippingCountryCode: address.countryCode,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              unitPrice: item.product.price,
              quantity: item.quantity,
            })),
          },
        },
        select: orderSelect,
      });

      await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    return toOrderSummary(order);
  }

  async listForUser(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: orderSelect,
    });

    return orders.map(toOrderSummary);
  }

  async findForUser(userId: string, orderNumber: string) {
    const order = await prisma.order.findFirst({
      where: { userId, orderNumber },
      select: orderSelect,
    });

    return order ? toOrderSummary(order) : null;
  }
}
