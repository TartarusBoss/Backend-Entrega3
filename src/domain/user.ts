import type { UserRole } from "@prisma/client";

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export interface UserRepository {
  findByEmail(email: string): Promise<(SafeUser & { passwordHash: string }) | null>;
  create(data: { name: string; email: string; passwordHash: string }): Promise<SafeUser>;
}
