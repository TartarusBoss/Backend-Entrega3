import { prisma } from "./prisma";
import type { UserRepository } from "../domain/user";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export class PrismaUserRepository implements UserRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { ...safeUserSelect, passwordHash: true },
    });
  }

  create(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({ data, select: safeUserSelect });
  }

  findById(id: number) {
    return prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  }
}
