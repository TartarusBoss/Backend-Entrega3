import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import productRouter from "./product-router";
import authRouter from "./auth-router";
import orderRequestRouter from "./order-request-router";
import { HttpError } from "../domain/errors";

export function createApp(frontendUrl: string) {
  const app = express();

  app.use(cors({ origin: frontendUrl }));
  app.use(express.json({ limit: "20kb" }));
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/products", productRouter);
  app.use("/api/requests", orderRequestRouter);

  const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      response.status(404).json({ error: "Recurso no encontrado" });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      response.status(409).json({ error: "Ya existe un registro con esos datos." });
      return;
    }
    if (error instanceof HttpError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ error: "El cuerpo de la solicitud no es un JSON válido." });
      return;
    }
    console.error("Error en la API:", error);
    response.status(500).json({ error: "Error interno del servidor" });
  };
  app.use(errorHandler);

  return app;
}
