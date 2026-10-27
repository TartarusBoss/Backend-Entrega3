import { prisma } from "./prisma";
import type { OrderRequestRepository } from "../domain/order-request";

const includeProduct = {
  product: { select: { id: true, name: true, category: true, price: true, image: true } },
} as const;

export class PrismaOrderRequestRepository implements OrderRequestRepository {
  create(data: { userId: number; productId: number; message: string }) {
    return prisma.orderRequest.create({ data, include: includeProduct });
  }

  findByUser(userId: number) {
    return prisma.orderRequest.findMany({
      where: { userId },
      include: includeProduct,
      orderBy: { createdAt: "desc" },
    });
  }

  findAll() {
    return prisma.orderRequest.findMany({
      include: {
        ...includeProduct,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
