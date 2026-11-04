import { Router } from "express";
import { prisma } from "../db/prisma.ts";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const songs = await prisma.song.findMany({
      orderBy: { title: "asc" },
    });

    res.json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar musicas" });
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
  const { title, artist, key, lyrics, chords } = body;

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title deve ser um texto preenchido" });
    return;
  }

  if (typeof lyrics !== "string" || !lyrics.trim()) {
    res.status(400).json({ error: "lyrics deve ser um texto preenchido" });
    return;
  }

  for (const [field, value] of Object.entries({ artist, key, chords })) {
    if (value !== undefined && typeof value !== "string") {
      res.status(400).json({ error: `${field} deve ser um texto` });
      return;
    }
  }

  try {
    const song = await prisma.song.create({
      data: {
        title: title.trim(),
        lyrics: lyrics.trim(),
        artist: typeof artist === "string" ? artist.trim() || undefined : undefined,
        key: typeof key === "string" ? key.trim() || undefined : undefined,
        chords: typeof chords === "string" ? chords : undefined,
      },
    });

    res.status(201).json(song);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao cadastrar musica" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
    });

    if (!song) {
      res.status(404).json({ error: "Musica nao encontrada" });
      return;
    }

    res.json(song);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar musica" });
  }
});

router.patch("/:id", async (req, res) => {
  const body: unknown = req.body;

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    res.status(400).json({ error: "Envie um objeto JSON" });
    return;
  }

  const fields = body as Record<string, unknown>;
  const allowedFields = ["title", "artist", "key", "lyrics", "chords"];
  const data: Record<string, string> = {};

  for (const field of Object.keys(fields)) {
    if (!allowedFields.includes(field)) {
      res.status(400).json({ error: `Campo nao permitido: ${field}` });
      return;
    }

    const value = fields[field];

    if (typeof value !== "string") {
      res.status(400).json({ error: `${field} deve ser um texto` });
      return;
    }

    if ((field === "title" || field === "lyrics") && !value.trim()) {
      res.status(400).json({ error: `${field} nao pode ficar vazio` });
      return;
    }

    data[field] = value.trim();
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Envie pelo menos um campo para atualizar" });
    return;
  }

  try {
    const id = req.params.id;
    const existingSong = await prisma.song.findUnique({ where: { id } });

    if (!existingSong) {
      res.status(404).json({ error: "Musica nao encontrada" });
      return;
    }

    const updatedSong = await prisma.song.update({
      where: { id },
      data,
    });

    res.json(updatedSong);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar musica" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await prisma.song.deleteMany({
      where: { id: req.params.id },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Musica nao encontrada" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir musica" });
  }
});

export default router;
