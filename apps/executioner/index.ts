import pino from "pino";
import { pollAndExecute } from "./lib/poll.js";

const logger = pino({ transport: { target: "pino-pretty" } });
const POLL_INTERVAL_MS = 10_000;

logger.info("Executioner starting, polling every %dms", POLL_INTERVAL_MS);

async function loop() {
  try {
    await pollAndExecute();
  } catch (err) {
    logger.error(err, "Poll cycle failed");
  }
  setTimeout(loop, POLL_INTERVAL_MS);
}

loop();
