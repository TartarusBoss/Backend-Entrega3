import { Router } from "express";
import { z } from "zod";
import { ProductService } from "../application/product-service";
import { PrismaProductRepository } from "../infrastructure/prisma-product-repository";

const router = Router();
const service = new ProductService(new PrismaProductRepository());

const pageQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(6),
});
const idParams = z.object({ id: z.coerce.number().int().positive() });

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

export default router;
