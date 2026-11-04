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

export default router;