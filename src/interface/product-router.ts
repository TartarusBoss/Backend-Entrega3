import { Router } from "express";
import { z } from "zod";
import { ProductService } from "../application/product-service";
import { PrismaProductRepository } from "../infrastructure/prisma-product-repository";
import { requireAdmin, requireAuth } from "./auth-middleware";

const router = Router();
const service = new ProductService(new PrismaProductRepository());

const pageQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(6),
});
const idParams = z.object({ id: z.coerce.number().int().positive() });
const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(["futbol", "basket", "mma"]),
  price: z.number().int().positive(),
  description: z.string().trim().min(5).max(1000),
  image: z.url().max(2048),
});

router.get("/", async (request, response, next) => {
  const parsed = pageQuery.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ error: "Parámetros de paginación inválidos", details: parsed.error.flatten() });
    return;
  }

  try {
    response.json(await service.list(parsed.data.page, parsed.data.limit));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  const parsed = idParams.safeParse(request.params);
  if (!parsed.success) {
    response.status(400).json({ error: "Identificador de producto inválido" });
    return;
  }

  try {
    response.json(await service.get(parsed.data.id));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth(process.env.JWT_SECRET!), requireAdmin, async (request, response, next) => {
  const parsed = productSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Datos de producto inválidos.", details: parsed.error.flatten() });
    return;
  }
  try {
    response.status(201).json(await service.create(parsed.data));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth(process.env.JWT_SECRET!), requireAdmin, async (request, response, next) => {
  const params = idParams.safeParse(request.params);
  const body = productSchema.safeParse(request.body);
  if (!params.success || !body.success) {
    response.status(400).json({ error: "Identificador o datos de producto inválidos." });
    return;
  }
  try {
    response.json(await service.update(params.data.id, body.data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth(process.env.JWT_SECRET!), requireAdmin, async (request, response, next) => {
  const parsed = idParams.safeParse(request.params);
  if (!parsed.success) {
    response.status(400).json({ error: "Identificador de producto inválido." });
    return;
  }
  try {
    await service.delete(parsed.data.id);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
