import "dotenv/config";
import { createApp } from "./interface/app";
import { prisma } from "./infrastructure/prisma";

const port = Number(process.env.PORT ?? 3001);
const frontendUrl = process.env.FRONTEND_URL;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un puerto válido.");
}
if (!frontendUrl) {
  throw new Error("FRONTEND_URL es obligatorio para configurar CORS.");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL es obligatorio.");
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET debe tener al menos 32 caracteres.");
}
if (!process.env.JWT_EXPIRES_IN) {
  throw new Error("JWT_EXPIRES_IN es obligatorio.");
}

const app = createApp(frontendUrl);
const server = app.listen(port, () => {
  console.log(`SportZone API escuchando en el puerto ${port}`);
});

async function shutdown(): Promise<void> {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
