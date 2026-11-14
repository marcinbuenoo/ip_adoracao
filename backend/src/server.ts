import express from "express";
import eventsRouter from "./routes/events.routes.ts";
import songsRouter from "./routes/songs.routes.ts";
import authRouter from "./routes/auth.routes.ts";
import usersRouter from "./routes/users.routes.ts";
import { requireAuth } from "./middleware/auth.middleware.ts";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
    res.json({status: "ok" });
});

app.use("/auth", authRouter);
app.use("/users", requireAuth, usersRouter);
app.use("/songs", requireAuth, songsRouter);
app.use("/events", requireAuth, eventsRouter);

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
})
