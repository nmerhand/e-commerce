import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { CatalogProduct, ProductRepository } from "./catalog.types";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  stock: true,
  imageUrl: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProductSelect;

type ProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

function toCatalogProduct(product: ProductRecord): CatalogProduct {
  return {
    ...product,
    price: product.price.toFixed(2),
  };
}

export class PrismaProductRepository implements ProductRepository {
  async listCategories() {
    return prisma.category.findMany({
      where: { products: { some: { isActive: true } } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
  }

  async list(input: {
    query?: string;
    category?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (input.query) {
      where.OR = [
        { name: { contains: input.query, mode: "insensitive" } },
        { description: { contains: input.query, mode: "insensitive" } },
      ];
    }

    if (input.category) {
      where.category = { is: { slug: input.category } };
    }

    const [records, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productSelect,
        orderBy: { name: "asc" },
        skip: input.skip,
        take: input.take,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: records.map(toCatalogProduct),
      total,
    };
  }

  async findBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      select: productSelect,
    });

    return product ? toCatalogProduct(product) : null;
  }
}
