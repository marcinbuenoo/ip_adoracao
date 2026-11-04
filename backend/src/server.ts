import express from "express";
import songsRouter from "./routes/songs.routes.ts";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
    res.json({status: "ok" });
});

app.use("/songs", songsRouter);

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
})