import cron from "node-cron";
import pino from "pino";
import { promoteJobs } from "./lib/promote.js";

const logger = pino({ transport: { target: "pino-pretty" } });

logger.info("Scheduler starting");

cron.schedule("*/5 * * * *", async () => {
  try {
    await promoteJobs();
    logger.info("Job promotion complete");
  } catch (err) {
    logger.error(err, "Job promotion failed");
  }
});
