import express from "express";
import { authRouter } from "./routes/auth.js";
import pino from "pino";

const logger = pino({ transport: { target: "pino-pretty" } });
const app = express();
app.use(express.json());
app.use("/auth", authRouter);
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT ?? 4001);
app.listen(PORT, () => logger.info(`Auth service running on port ${PORT}`));
