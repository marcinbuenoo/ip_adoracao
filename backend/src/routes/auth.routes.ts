import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { SignJWT } from "jose";
import { prisma } from "../db/prisma.ts";

const router = Router();
const googleClient = new OAuth2Client();

function jwtSecret(): Uint8Array | undefined {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length >= 32 ? new TextEncoder().encode(secret) : undefined;
}

router.post("/google", async (req, res) => {
  const idToken: unknown = req.body?.idToken;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const secret = jwtSecret();
  if (typeof idToken !== "string" || !idToken || !googleClientId || !secret) {
    res.status(400).json({ error: "Configuração ou token de login inválido" });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientId });
    const claims = ticket.getPayload();
    if (!claims?.sub || !claims.email || !claims.email_verified || !claims.name) {
      res.status(401).json({ error: "A conta Google não forneceu os dados verificados necessários" });
      return;
    }

    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const email = claims.email.toLowerCase();
    const isBootstrapAdmin = Boolean(bootstrapEmail && email === bootstrapEmail);
    const existing = await prisma.user.findUnique({ where: { googleSub: claims.sub } });

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            email,
            name: claims.name,
            picture: claims.picture ?? null,
            ...(isBootstrapAdmin ? { role: "ADMIN" as const, status: "ACTIVE" as const } : {}),
          },
        })
      : await prisma.user.create({
          data: {
            googleSub: claims.sub,
            email,
            name: claims.name,
            picture: claims.picture ?? null,
            ...(isBootstrapAdmin ? { role: "ADMIN", status: "ACTIVE" } : {}),
          },
        });

    if (user.status === "PENDING") {
      res.status(202).json({ status: user.status, message: "Aguardando aprovação da liderança" });
      return;
    }
    if (user.status === "REJECTED") {
      res.status(403).json({ status: user.status, message: "Acesso não aprovado" });
      return;
    }

    const accessToken = await new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuer("ip-adoracao-api")
      .setAudience("ip-adoracao-app")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    res.json({
      status: user.status,
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, picture: user.picture, role: user.role },
    });
  } catch (error) {
    console.error("Falha ao autenticar com Google:", error);
    res.status(401).json({ error: "Não foi possível validar o login do Google" });
  }
});

export default router;
