import { Router } from "express";
import { EventType } from "../generated/prisma/enums.ts";
import { prisma } from "../db/prisma.ts";

const router = Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

router.get("/:eventId", async (req, res) => {
  const { eventId } = req.params;

  if (!uuidPattern.test(eventId)) {
    res.status(400).json({ error: "eventId deve ser um UUID valido" });
    return;
  }

  try {
    const event = await prisma.ministryEvent.findUnique({
      where: { id: eventId },
      include: {
        setlist: {
          orderBy: { position: "asc" },
          include: { song: true },
        },
      },
    });

    if (!event) {
      res.status(404).json({ error: "Evento nao encontrado" });
      return;
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar evento" });
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

router.patch("/:eventId", async (req, res) => {
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
  const allowedFields = ["title", "type", "startsAt", "location", "notes"];
  const invalidField = Object.keys(body).find(
    (field) => !allowedFields.includes(field),
  );

  if (invalidField) {
    res.status(400).json({ error: `Campo nao permitido: ${invalidField}` });
    return;
  }

  const data: {
    title?: string;
    type?: EventType;
    startsAt?: Date;
    location?: string | null;
    notes?: string | null;
  } = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      res.status(400).json({ error: "title deve ser um texto preenchido" });
      return;
    }
    data.title = body.title.trim();
  }

  if ("type" in body) {
    if (body.type !== EventType.WORSHIP && body.type !== EventType.REHEARSAL) {
      res.status(400).json({ error: "type deve ser WORSHIP ou REHEARSAL" });
      return;
    }
    data.type = body.type;
  }

  if ("startsAt" in body) {
    if (typeof body.startsAt !== "string" || !body.startsAt.trim()) {
      res.status(400).json({ error: "startsAt deve ser uma data em texto" });
      return;
    }

    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      res.status(400).json({ error: "startsAt deve ser uma data valida" });
      return;
    }
    data.startsAt = startsAt;
  }

  for (const field of ["location", "notes"] as const) {
    if (field in body) {
      const value = body[field];
      if (value !== null && typeof value !== "string") {
        res.status(400).json({ error: `${field} deve ser um texto ou null` });
        return;
      }
      data[field] = typeof value === "string" ? value.trim() || null : null;
    }
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Envie pelo menos um campo para atualizar" });
    return;
  }

  const { eventId } = req.params;
  if (!uuidPattern.test(eventId)) {
    res.status(400).json({ error: "eventId deve ser um UUID valido" });
    return;
  }

  try {
    const existingEvent = await prisma.ministryEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      res.status(404).json({ error: "Evento nao encontrado" });
      return;
    }

    const event = await prisma.ministryEvent.update({
      where: { id: eventId },
      data,
    });

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar evento" });
  }
});

router.delete("/:eventId", async (req, res) => {
  const { eventId } = req.params;

  if (!uuidPattern.test(eventId)) {
    res.status(400).json({ error: "eventId deve ser um UUID valido" });
    return;
  }

  try {
    const result = await prisma.ministryEvent.deleteMany({
      where: { id: eventId },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Evento nao encontrado" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir evento" });
  }
});

router.post("/:eventId/setlist", async (req, res) => {
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
  const { songId, position, key } = body;
  const eventId = req.params.eventId;

  if (!uuidPattern.test(eventId)) {
    res.status(400).json({ error: "eventId deve ser um UUID valido" });
    return;
  }

  if (typeof songId !== "string" || !uuidPattern.test(songId)) {
    res.status(400).json({ error: "songId deve ser um UUID valido" });
    return;
  }

  if (typeof position !== "number" || !Number.isInteger(position) || position < 1) {
    res.status(400).json({ error: "position deve ser um inteiro positivo" });
    return;
  }

  if (key !== undefined && typeof key !== "string") {
    res.status(400).json({ error: "key deve ser um texto" });
    return;
  }

  try {
    const event = await prisma.ministryEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      res.status(404).json({ error: "Evento nao encontrado" });
      return;
    }

    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      res.status(404).json({ error: "Musica nao encontrada" });
      return;
    }

    const positionInUse = await prisma.setlistItem.findUnique({
      where: {
        eventId_position: { eventId, position },
      },
    });

    if (positionInUse) {
      res.status(409).json({ error: "Essa posicao ja esta ocupada no repertorio" });
      return;
    }

    const setlistItem = await prisma.setlistItem.create({
      data: {
        eventId,
        songId,
        position,
        key: typeof key === "string" ? key.trim() || undefined : undefined,
      },
      include: { song: true },
    });

    res.status(201).json(setlistItem);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({ error: "Essa posicao ja esta ocupada no repertorio" });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Erro ao adicionar musica ao repertorio" });
  }
});

router.patch("/:eventId/setlist/:itemId", async (req, res) => {
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
  const allowedFields = ["position", "key"];
  const invalidField = Object.keys(body).find(
    (field) => !allowedFields.includes(field),
  );

  if (invalidField) {
    res.status(400).json({ error: `Campo nao permitido: ${invalidField}` });
    return;
  }

  const data: { position?: number; key?: string | null } = {};

  if ("position" in body) {
    if (
      typeof body.position !== "number" ||
      !Number.isInteger(body.position) ||
      body.position < 1
    ) {
      res.status(400).json({ error: "position deve ser um inteiro positivo" });
      return;
    }

    data.position = body.position;
  }

  if ("key" in body) {
    if (body.key !== null && typeof body.key !== "string") {
      res.status(400).json({ error: "key deve ser um texto ou null" });
      return;
    }

    data.key = typeof body.key === "string" ? body.key.trim() || null : null;
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Envie position, key ou ambos" });
    return;
  }

  const { eventId, itemId } = req.params;

  if (!uuidPattern.test(eventId) || !uuidPattern.test(itemId)) {
    res.status(400).json({ error: "eventId e itemId devem ser UUIDs validos" });
    return;
  }

  try {
    const item = await prisma.setlistItem.findFirst({
      where: { id: itemId, eventId },
    });

    if (!item) {
      res.status(404).json({ error: "Item nao encontrado neste evento" });
      return;
    }

    if (data.position !== undefined) {
      const positionInUse = await prisma.setlistItem.findUnique({
        where: {
          eventId_position: { eventId, position: data.position },
        },
      });

      if (positionInUse && positionInUse.id !== itemId) {
        res.status(409).json({ error: "Essa posicao ja esta ocupada no repertorio" });
        return;
      }
    }

    const updatedItem = await prisma.setlistItem.update({
      where: { id: itemId },
      data,
      include: { song: true },
    });

    res.json(updatedItem);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({ error: "Essa posicao ja esta ocupada no repertorio" });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar item do repertorio" });
  }
});

router.delete("/:eventId/setlist/:itemId", async (req, res) => {
  const { eventId, itemId } = req.params;

  if (!uuidPattern.test(eventId) || !uuidPattern.test(itemId)) {
    res.status(400).json({ error: "eventId e itemId devem ser UUIDs validos" });
    return;
  }

  try {
    const result = await prisma.setlistItem.deleteMany({
      where: { id: itemId, eventId },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Item nao encontrado neste evento" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover musica do repertorio" });
  }
});

export default router;
