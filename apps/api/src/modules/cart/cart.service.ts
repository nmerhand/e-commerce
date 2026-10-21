import { HttpError } from "../../lib/http-error";
import { fromCents, toCents } from "../../lib/money";
import type { Cart, CartRepository, CartService } from "./cart.types";

function toCart(record: Awaited<ReturnType<CartRepository["getCart"]>>): Cart {
  const items = record.items.map((item) => ({
    productId: item.productId,
    slug: item.product.slug,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    stock: item.product.stock,
    imageUrl: item.product.imageUrl,
    available: item.product.isActive && item.product.stock >= item.quantity,
    lineTotal: fromCents(toCents(item.product.price) * item.quantity),
  }));
  const totalCents = items.reduce(
    (total, item) => total + toCents(item.lineTotal),
    0,
  );

  return {
    items,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: fromCents(totalCents),
  };
}

export function createCartService(repository: CartRepository): CartService {
  async function getCart(userId: string) {
    return toCart(await repository.getCart(userId));
  }

  async function ensureAvailable(productId: string, quantity: number) {
    const product = await repository.findProduct(productId);

    if (!product || !product.isActive) {
      throw new HttpError(404, "Product is not available");
    }

    if (quantity > product.stock) {
      throw new HttpError(409, "Requested quantity exceeds available stock");
    }
  }

  return {
    getCart,
    async addItem(userId, productId, quantity) {
      const cart = await repository.getCart(userId);
      const existingQuantity = await repository.findItemQuantity(
        cart.id,
        productId,
      );
      const nextQuantity = (existingQuantity ?? 0) + quantity;

      if (nextQuantity > 99) {
        throw new HttpError(400, "A maximum of 99 units can be added");
      }

      await ensureAvailable(productId, nextQuantity);
      await repository.saveItem(cart.id, productId, nextQuantity);

      return getCart(userId);
    },
    async setItemQuantity(userId, productId, quantity) {
      const cart = await repository.getCart(userId);
      const existingQuantity = await repository.findItemQuantity(
        cart.id,
        productId,
      );

      if (existingQuantity === null) {
        throw new HttpError(404, "Cart item not found");
      }

      await ensureAvailable(productId, quantity);
      const updated = await repository.setItemQuantity(
        cart.id,
        productId,
        quantity,
      );

      if (!updated) {
        throw new HttpError(404, "Cart item not found");
      }

      return getCart(userId);
    },
    async removeItem(userId, productId) {
      const cart = await repository.getCart(userId);
      const removed = await repository.removeItem(cart.id, productId);

      if (!removed) {
        throw new HttpError(404, "Cart item not found");
      }

      return getCart(userId);
    },
  };
}
