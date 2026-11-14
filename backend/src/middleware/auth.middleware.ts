import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { prisma } from "../db/prisma.ts";

export type AuthUser = {
  id: string;
  email: string;
  role: "MEMBER" | "LEADER" | "ADMIN";
};

declare global {
  namespace Express {
    interface Locals {
      user?: AuthUser;
    }
  }
}

function jwtSecret(): Uint8Array | undefined {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length >= 32 ? new TextEncoder().encode(secret) : undefined;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const secret = jwtSecret();

  if (!token || !secret) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "ip-adoracao-api",
      audience: "ip-adoracao-app",
    });
    if (typeof payload.sub !== "string") {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") {
      res.status(403).json({ error: "Usuário sem acesso ativo" });
      return;
    }

    res.locals.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function requireRoles(...roles: AuthUser["role"][]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!res.locals.user || !roles.includes(res.locals.user.role)) {
      res.status(403).json({ error: "Permissão insuficiente" });
      return;
    }
    next();
  };
}
