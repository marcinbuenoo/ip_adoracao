import express from "express";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
    res.json({status: "ok" });
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
})