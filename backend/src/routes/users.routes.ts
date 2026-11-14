import { Router } from "express";
import { prisma } from "../db/prisma.ts";
import { requireRoles } from "../middleware/auth.middleware.ts";

const router = Router();
router.use(requireRoles("ADMIN", "LEADER"));

router.get("/pending", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, picture: true, role: true, status: true, createdAt: true },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar usuários pendentes" });
  }
});

router.patch("/:userId/status", async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body ?? {};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    res.status(400).json({ error: "userId deve ser um UUID válido" });
    return;
  }
  if (status !== "ACTIVE" && status !== "REJECTED") {
    res.status(400).json({ error: "status deve ser ACTIVE ou REJECTED" });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    res.json(user);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

router.patch("/:userId/role", requireRoles("ADMIN"), async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body ?? {};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    res.status(400).json({ error: "userId deve ser um UUID válido" });
    return;
  }
  if (role !== "MEMBER" && role !== "LEADER") {
    res.status(400).json({ error: "role deve ser MEMBER ou LEADER" });
    return;
  }
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    res.json(user);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar função do usuário" });
  }
});

export default router;
