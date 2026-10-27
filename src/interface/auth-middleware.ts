import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../domain/errors";
import type { UserRole } from "@prisma/client";

export type AuthenticatedUser = { id: number; role: UserRole };

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(jwtSecret: string) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const authorization = request.header("Authorization");
    const [scheme, token] = authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      next(new HttpError("Se requiere autenticación.", 401));
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      if (
        typeof payload !== "object" ||
        payload === null ||
        typeof payload.id !== "number" ||
        (payload.role !== "admin" && payload.role !== "user")
      ) {
        throw new HttpError("Token inválido.", 401);
      }

      request.user = { id: payload.id, role: payload.role };
      next();
    } catch (error) {
      next(error instanceof HttpError ? error : new HttpError("Token inválido o expirado.", 401));
    }
  };
}

export function requireAdmin(request: Request, _response: Response, next: NextFunction) {
  if (request.user?.role !== "admin") {
    next(new HttpError("No tienes permisos para realizar esta acción.", 403));
    return;
  }
  next();
}
