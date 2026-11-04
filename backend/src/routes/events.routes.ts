import { Router } from "express";
import { EventType } from "../generated/prisma/enums.ts";
import { prisma } from "../db/prisma.ts";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const events = await prisma.ministryEvent.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        setlist: {
          orderBy: { position: "asc" },
          include: { song: true },
        },
      },
    });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar eventos" });
  }
});

router.post("/", async (req, res) => {
  const rawBody: unknown = req.body;

  if (
    typeof rawBody !== "object" ||
    rawBody === null ||
    Array.isArray(rawBody)
  ) {
    res.status(400).json({ error: "Envie um objeto JSON" });
    return;
  }

  const body = rawBody as Record<string, unknown>;
  const { title, type, startsAt, location, notes } = body;

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title deve ser um texto preenchido" });
    return;
  }

  if (type !== EventType.WORSHIP && type !== EventType.REHEARSAL) {
    res.status(400).json({ error: "type deve ser WORSHIP ou REHEARSAL" });
    return;
  }

  if (typeof startsAt !== "string" || !startsAt.trim()) {
    res.status(400).json({ error: "startsAt deve ser uma data em texto" });
    return;
  }

  const startsAtDate = new Date(startsAt);

  if (Number.isNaN(startsAtDate.getTime())) {
    res.status(400).json({ error: "startsAt deve ser uma data valida" });
    return;
  }

  for (const [field, value] of Object.entries({ location, notes })) {
    if (value !== undefined && typeof value !== "string") {
      res.status(400).json({ error: `${field} deve ser um texto` });
      return;
    }
  }

  try {
    const event = await prisma.ministryEvent.create({
      data: {
        title: title.trim(),
        type,
        startsAt: startsAtDate,
        location: typeof location === "string" ? location.trim() || undefined : undefined,
        notes: typeof notes === "string" ? notes.trim() || undefined : undefined,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao cadastrar evento" });
  }
});

export default router;
