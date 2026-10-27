import { Router } from "express";
import { z } from "zod";
import { OrderRequestService } from "../application/order-request-service";
import { PrismaOrderRequestRepository } from "../infrastructure/prisma-order-request-repository";
import { PrismaProductRepository } from "../infrastructure/prisma-product-repository";
import { requireAdmin, requireAuth } from "./auth-middleware";

const router = Router();
const service = new OrderRequestService(new PrismaOrderRequestRepository(), new PrismaProductRepository());
const createSchema = z.object({
  productId: z.number().int().positive(),
  message: z.string().trim().min(10).max(2000),
});

router.use(requireAuth(process.env.JWT_SECRET!));

router.post("/", async (request, response, next) => {
  const parsed = createSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Datos de solicitud inválidos.", details: parsed.error.flatten() });
    return;
  }

  try {
    response.status(201).json(
      await service.create(request.user!.id, parsed.data.productId, parsed.data.message),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/mias", async (request, response, next) => {
  try {
    response.json(await service.mine(request.user!.id));
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAdmin, async (_request, response, next) => {
  try {
    response.json(await service.all());
  } catch (error) {
    next(error);
  }
});

export default router;
