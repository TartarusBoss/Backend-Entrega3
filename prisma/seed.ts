import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  {
    name: "Balón Oficial de Fútbol",
    category: "futbol",
    price: 120000,
    description: "Cosido a mano, alta durabilidad para césped sintético y natural.",
    image: "https://images.unsplash.com/photo-1614632537190-23e4146777db?w=400&q=80",
  },
  {
    name: "Guantes de MMA 4oz",
    category: "mma",
    price: 95000,
    description: "Cuero sintético con acolchado de alta densidad para sparring.",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/94/Boxing_gloves.jpg",
  },
  {
    name: "Balón de Básquetbol No. 7",
    category: "basket",
    price: 110000,
    description: "Agarre profesional antideslizante para canchas interiores y exteriores.",
    image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&q=80",
  },
  {
    name: "Guantes de Boxeo / MMA",
    category: "mma",
    price: 130000,
    description: "Protección muñeca doble agarre, ideal para entrenamiento pesado.",
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80",
  },
  {
    name: "Camiseta de Entrenamiento Fútbol",
    category: "futbol",
    price: 75000,
    description: "Tela transpirable con tecnología de secado rápido.",
    image: "https://futboldeprimera.com.co/wp-content/uploads/PhotoRoom-20240112_105329_5.png",
  },
  {
    name: "Aro de Básquetbol Portátil",
    category: "basket",
    price: 350000,
    description: "Ajustable en altura con base rellenable de agua o arena.",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80",
  },
];

async function seedProducts(): Promise<void> {
  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: product,
      create: product,
    });
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userPassword = process.env.SEED_USER_PASSWORD;
  if (!adminPassword || !userPassword) {
    throw new Error("Define SEED_ADMIN_PASSWORD y SEED_USER_PASSWORD antes de ejecutar el seed.");
  }

  await prisma.user.upsert({
    where: { email: "admin@sportzone.test" },
    update: { name: "Admin SportZone", passwordHash: await bcrypt.hash(adminPassword, 12), role: "admin" },
    create: {
      name: "Admin SportZone",
      email: "admin@sportzone.test",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "admin",
    },
  });
  await prisma.user.upsert({
    where: { email: "usuario@sportzone.test" },
    update: { name: "Usuario SportZone", passwordHash: await bcrypt.hash(userPassword, 12), role: "user" },
    create: {
      name: "Usuario SportZone",
      email: "usuario@sportzone.test",
      passwordHash: await bcrypt.hash(userPassword, 12),
      role: "user",
    },
  });
}

seedProducts()
  .catch((error: unknown) => {
    console.error("No se pudo cargar el catálogo inicial:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
