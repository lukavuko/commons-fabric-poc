import { prisma, JobStatus } from "@cfp/db";

const PENDING_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function promoteJobs(): Promise<void> {
  const now = new Date();
  const pendingCutoff = new Date(now.getTime() + PENDING_WINDOW_MS);

  await prisma.jobQueue.updateMany({
    where: { status: JobStatus.SCHEDULED, fireAt: { lte: pendingCutoff } },
    data: { status: JobStatus.PENDING },
  });

  await prisma.jobQueue.updateMany({
    where: { status: JobStatus.PENDING, fireAt: { lte: now } },
    data: { status: JobStatus.READY },
  });
}
