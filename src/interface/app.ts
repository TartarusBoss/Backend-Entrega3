import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import productRouter from "./product-router";

export function createApp(frontendUrl: string) {
  const app = express();

  app.use(cors({ origin: frontendUrl }));
  app.use(express.json({ limit: "20kb" }));
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.use("/api/products", productRouter);

  const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      response.status(404).json({ error: "Recurso no encontrado" });
      return;
    }

    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    const message = statusCode < 500 && error instanceof Error ? error.message : "Error interno del servidor";
    if (statusCode >= 500) {
      console.error("Error en la API:", error);
    }
    response.status(statusCode).json({ error: message });
  };
  app.use(errorHandler);

  return app;
}
