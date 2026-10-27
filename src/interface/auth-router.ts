import { Router } from "express";
import { z } from "zod";
import { AuthService } from "../application/auth-service";
import { PrismaUserRepository } from "../infrastructure/prisma-user-repository";

const router = Router();
const service = new AuthService(new PrismaUserRepository(), {
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN!,
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
});
const loginSchema = z.object({
  email: z.email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72),
});

router.post("/register", async (request, response, next) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Datos de registro inválidos.", details: parsed.error.flatten() });
    return;
  }

  try {
    response.status(201).json(await service.register(parsed.data.name, parsed.data.email, parsed.data.password));
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (request, response, next) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Datos de inicio de sesión inválidos.", details: parsed.error.flatten() });
    return;
  }

  try {
    response.json(await service.login(parsed.data.email, parsed.data.password));
  } catch (error) {
    next(error);
  }
});

export default router;
