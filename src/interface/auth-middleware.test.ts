import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { ErrorRequestHandler } from "express";
import express from "express";
import jwt from "jsonwebtoken";
import { after, before, test } from "node:test";
import { HttpError } from "../domain/errors";
import { requireAdmin, requireAuth } from "./auth-middleware";

const secret = "automated-test-secret-with-at-least-thirty-two-characters";
const app = express();
const server: Server = createServer(app);
let baseUrl: string;

app.get(
  "/admin",
  requireAuth(secret),
  requireAdmin,
  (request, response) => response.json({ userId: request.user?.id, role: request.user?.role }),
);

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  const status = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Error interno";
  response.status(status).json({ error: message });
};
app.use(errorHandler);

function createToken(id: number, role: "admin" | "user") {
  return jwt.sign({ id, role }, secret, { expiresIn: "5m" });
}

async function getAdminRoute(token?: string) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  return fetch(`${baseUrl}/admin`, { headers });
}

before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("No se pudo obtener el puerto del servidor de pruebas.");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server.listening) {
    server.close();
    await once(server, "close");
  }
});

test("responde 401 cuando falta el token", async () => {
  const response = await getAdminRoute();
  assert.equal(response.status, 401);
});

test("responde 401 cuando el token es inválido o expiró", async () => {
  const invalidToken = jwt.sign({ id: 1, role: "admin" }, "otra-clave");
  const expiredToken = jwt.sign(
    { id: 1, role: "admin", exp: Math.floor(Date.now() / 1000) - 60 },
    secret,
  );

  assert.equal((await getAdminRoute(invalidToken)).status, 401);
  assert.equal((await getAdminRoute(expiredToken)).status, 401);
});

test("responde 403 si un usuario intenta acceder a una ruta de administración", async () => {
  const response = await getAdminRoute(createToken(42, "user"));
  assert.equal(response.status, 403);
});

test("permite el acceso administrativo con un token válido de admin", async () => {
  const response = await getAdminRoute(createToken(7, "admin"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { userId: 7, role: "admin" });
});
