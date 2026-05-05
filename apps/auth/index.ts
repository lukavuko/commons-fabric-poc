import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import pino from "pino";

const logger = pino({ transport: { target: "pino-pretty" } });
const app = express();

// CORS — allow the web origin (defaults to the local Vite dev server).
// Set WEB_ORIGIN to a comma-separated list for staging/prod.
const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());
app.use("/auth", authRouter);
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT ?? 4001);
app.listen(PORT, () => logger.info(`Auth service running on port ${PORT}`));
