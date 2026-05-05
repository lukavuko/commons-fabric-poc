import { prisma, JobStatus } from "@cfp/db";
import { handlers } from "../handlers/index.js";

export async function pollAndExecute(): Promise<void> {
  const jobs = await prisma.jobQueue.findMany({
    where: { status: JobStatus.READY },
    orderBy: { fireAt: "asc" },
    take: 10,
  });

  for (const job of jobs) {
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: JobStatus.RUNNING, startedAt: new Date() },
    });

    try {
      const handler = handlers[job.serviceName];
      if (!handler)
        throw new Error(
          `No handler registered for service: ${job.serviceName}`,
        );
      await handler(job.payload);
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: { status: JobStatus.COMPLETE, completedAt: new Date() },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const newRetryCount = job.retryCount + 1;
      if (newRetryCount < job.maxRetries) {
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: JobStatus.READY,
            retryCount: newRetryCount,
            errorMessage,
          },
        });
      } else {
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            retryCount: newRetryCount,
            errorMessage,
            completedAt: new Date(),
          },
        });
      }
    }
  }
}
