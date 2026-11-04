import express from "express";
import eventsRouter from "./routes/events.routes.ts";
import songsRouter from "./routes/songs.routes.ts";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
    res.json({status: "ok" });
});

app.use("/songs", songsRouter);
app.use("/events", eventsRouter);

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
})
