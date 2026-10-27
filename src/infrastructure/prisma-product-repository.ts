import type { ProductRepository } from "../domain/product";
import { prisma } from "./prisma";

export class PrismaProductRepository implements ProductRepository {
  async findPage(page: number, limit: number) {
    const [total, data] = await prisma.$transaction([
      prisma.product.count(),
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: "asc" },
      }),
    ]);

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  findById(id: number) {
    return prisma.product.findUnique({ where: { id } });
  }

  create(data: { name: string; category: string; price: number; description: string; image: string }) {
    return prisma.product.create({ data });
  }

  update(
    id: number,
    data: { name: string; category: string; price: number; description: string; image: string },
  ) {
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: number) {
    await prisma.product.delete({ where: { id } });
  }
}
