import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../src/lib/http-error";
import { createCartService } from "../src/modules/cart/cart.service";
import type {
  CartProduct,
  CartRecord,
  CartRepository,
} from "../src/modules/cart/cart.types";

const product: CartProduct = {
  id: "product-1",
  name: "Tasse",
  slug: "tasse",
  price: "18.50",
  stock: 5,
  imageUrl: null,
  isActive: true,
};

function createRepository(initialItems: CartRecord["items"] = []) {
  const record: CartRecord = { id: "cart-1", items: [...initialItems] };
  const repository: CartRepository = {
    getCart: vi.fn(async () => ({
      id: record.id,
      items: record.items.map((item) => ({
        ...item,
        product: { ...item.product },
      })),
    })),
    findProduct: vi.fn(async (productId) =>
      productId === product.id ? product : null,
    ),
    findItemQuantity: vi.fn(async (_cartId, productId) => {
      return (
        record.items.find((item) => item.productId === productId)?.quantity ??
        null
      );
    }),
    saveItem: vi.fn(async (cartId, productId, quantity) => {
      const existing = record.items.find(
        (item) => item.productId === productId,
      );
      if (existing) {
        existing.quantity = quantity;
      } else {
        record.items.push({ productId, quantity, product });
      }
      expect(cartId).toBe(record.id);
    }),
    setItemQuantity: vi.fn(async (_cartId, productId, quantity) => {
      const existing = record.items.find(
        (item) => item.productId === productId,
      );
      if (!existing) return false;
      existing.quantity = quantity;
      return true;
    }),
    removeItem: vi.fn(async (_cartId, productId) => {
      const index = record.items.findIndex(
        (item) => item.productId === productId,
      );
      if (index < 0) return false;
      record.items.splice(index, 1);
      return true;
    }),
  };

  return { repository, record };
}

describe("cart service", () => {
  it("adds quantities and calculates exact decimal totals", async () => {
    const { repository } = createRepository([
      { productId: product.id, quantity: 2, product },
    ]);
    const service = createCartService(repository);

    const cart = await service.addItem("user-1", product.id, 1);

    expect(repository.saveItem).toHaveBeenCalledWith("cart-1", product.id, 3);
    expect(cart.items[0]?.lineTotal).toBe("55.50");
    expect(cart.totalItems).toBe(3);
    expect(cart.subtotal).toBe("55.50");
  });

  it("rejects quantities above current stock", async () => {
    const { repository } = createRepository([
      { productId: product.id, quantity: 4, product },
    ]);
    const service = createCartService(repository);

    await expect(
      service.addItem("user-1", product.id, 2),
    ).rejects.toMatchObject({
      statusCode: 409,
    } satisfies Partial<HttpError>);
    expect(repository.saveItem).not.toHaveBeenCalled();
  });

  it("marks products unavailable when the stock drops below the cart quantity", async () => {
    const { repository } = createRepository([
      {
        productId: product.id,
        quantity: 6,
        product: { ...product, stock: 5 },
      },
    ]);
    const service = createCartService(repository);

    const cart = await service.getCart("user-1");

    expect(cart.items[0]?.available).toBe(false);
  });
});
