import "dotenv/config";
import argon2 from "argon2";
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
      update: {},
      create: {
        ...product,
        categoryId: category.id,
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (Boolean(adminEmail) !== Boolean(adminPassword)) {
    throw new Error("Set both ADMIN_EMAIL and ADMIN_PASSWORD to seed an admin");
  }
  if (adminEmail && adminPassword) {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) ||
      adminPassword.length < 12
    ) {
      throw new Error(
        "Admin email must be valid and password at least 12 characters",
      );
    }

    const passwordHash = await argon2.hash(adminPassword, {
      type: argon2.argon2id,
    });
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: {
        email: adminEmail,
        name: "Administrateur",
        passwordHash,
        role: "ADMIN",
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
