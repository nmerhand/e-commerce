import "dotenv/config";
import { prisma } from "../apps/api/src/lib/prisma";

const products = [
  {
    name: "Tasse en céramique",
    slug: "tasse-ceramique",
    description: "Tasse en céramique émaillée, fabriquée artisanalement.",
    price: "18.00",
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d",
  },
  {
    name: "Vase minimaliste",
    slug: "vase-minimaliste",
    description: "Vase décoratif aux lignes simples pour la maison.",
    price: "32.50",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d",
  },
  {
    name: "Carnet de notes",
    slug: "carnet-de-notes",
    description: "Carnet à couverture rigide et papier recyclé.",
    price: "12.90",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57",
  },
];

async function seed() {
  const category = await prisma.category.upsert({
    where: { slug: "maison" },
    update: {},
    create: { name: "Maison", slug: "maison" },
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...product,
        categoryId: category.id,
      },
      create: {
        ...product,
        categoryId: category.id,
      },
    });
  }
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
