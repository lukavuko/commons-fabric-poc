import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateMany = vi.fn().mockResolvedValue({ count: 0 });

vi.mock("@cfp/db", () => ({
  prisma: { jobQueue: { updateMany: mockUpdateMany } },
  JobStatus: { SCHEDULED: "SCHEDULED", PENDING: "PENDING", READY: "READY" },
}));

const { promoteJobs } = await import("../lib/promote.js");

describe("promoteJobs", () => {
  beforeEach(() => mockUpdateMany.mockClear());

  it("calls updateMany twice (SCHEDULED→PENDING and PENDING→READY)", async () => {
    await promoteJobs();
    expect(mockUpdateMany).toHaveBeenCalledTimes(2);
  });

  it("promotes SCHEDULED jobs within 24h to PENDING", async () => {
    await promoteJobs();
    const [firstCall] = mockUpdateMany.mock.calls;
    expect(firstCall[0].where.status).toBe("SCHEDULED");
    expect(firstCall[0].data).toEqual({ status: "PENDING" });
  });

  it("promotes PENDING jobs past fireAt to READY", async () => {
    await promoteJobs();
    const [, secondCall] = mockUpdateMany.mock.calls;
    expect(secondCall[0].where.status).toBe("PENDING");
    expect(secondCall[0].data).toEqual({ status: "READY" });
  });
});
