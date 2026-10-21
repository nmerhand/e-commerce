import { prisma } from "../../lib/prisma";
import type { CartProduct, CartRecord, CartRepository } from "./cart.types";

const cartItemSelect = {
  productId: true,
  quantity: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stock: true,
      imageUrl: true,
      isActive: true,
    },
  },
} as const;

export class PrismaCartRepository implements CartRepository {
  async getCart(userId: string): Promise<CartRecord> {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: {
        id: true,
        items: { select: cartItemSelect },
      },
    });

    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        product: {
          ...item.product,
          price: item.product.price.toFixed(2),
        },
      })),
    };
  }

  async findProduct(productId: string): Promise<CartProduct | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        imageUrl: true,
        isActive: true,
      },
    });

    return product ? { ...product, price: product.price.toFixed(2) } : null;
  }

  async findItemQuantity(cartId: string, productId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
      select: { quantity: true },
    });

    return item?.quantity ?? null;
  }

  async saveItem(cartId: string, productId: string, quantity: number) {
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      update: { quantity },
      create: { cartId, productId, quantity },
    });
  }

  async setItemQuantity(cartId: string, productId: string, quantity: number) {
    const result = await prisma.cartItem.updateMany({
      where: { cartId, productId },
      data: { quantity },
    });

    return result.count > 0;
  }

  async removeItem(cartId: string, productId: string) {
    const result = await prisma.cartItem.deleteMany({
      where: { cartId, productId },
    });

    return result.count > 0;
  }
}
