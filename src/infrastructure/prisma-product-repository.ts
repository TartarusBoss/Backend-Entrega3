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
}
