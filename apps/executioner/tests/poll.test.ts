import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JobQueue } from "@cfp/db";

const mockFindMany = vi.fn();
const mockUpdate = vi.fn().mockResolvedValue({});
const mockSuccessHandler = vi.fn().mockResolvedValue(undefined);
const mockFailHandler = vi.fn().mockRejectedValue(new Error("boom"));

vi.mock("@cfp/db", () => ({
  prisma: { jobQueue: { findMany: mockFindMany, update: mockUpdate } },
  JobStatus: { READY: "READY", RUNNING: "RUNNING", COMPLETE: "COMPLETE", FAILED: "FAILED" },
}));

vi.mock("../handlers/index.js", () => ({
  handlers: { "ok-job": mockSuccessHandler, "bad-job": mockFailHandler },
}));

const { pollAndExecute } = await import("../lib/poll.js");

const makeJob = (overrides: Partial<JobQueue> = {}): JobQueue =>
  ({ id: "j1", serviceName: "ok-job", payload: {}, retryCount: 0, maxRetries: 3, ...overrides } as JobQueue);

describe("pollAndExecute", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockSuccessHandler.mockClear();
    mockFailHandler.mockClear();
  });

  it("does nothing when no READY jobs exist", async () => {
    mockFindMany.mockResolvedValue([]);
    await pollAndExecute();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("marks job RUNNING then COMPLETE on success", async () => {
    mockFindMany.mockResolvedValue([makeJob()]);
    await pollAndExecute();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "RUNNING" }) })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETE" }) })
    );
  });

  it("requeues as READY when failure and retries remain", async () => {
    mockFindMany.mockResolvedValue([makeJob({ serviceName: "bad-job", retryCount: 0, maxRetries: 3 })]);
    await pollAndExecute();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "READY", retryCount: 1 }) })
    );
  });

  it("marks FAILED when retry count reaches max", async () => {
    mockFindMany.mockResolvedValue([makeJob({ serviceName: "bad-job", retryCount: 2, maxRetries: 3 })]);
    await pollAndExecute();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED", errorMessage: "boom" }) })
    );
  });

  it("marks FAILED for unknown service name", async () => {
    mockFindMany.mockResolvedValue([makeJob({ serviceName: "unknown", retryCount: 2, maxRetries: 3 })]);
    await pollAndExecute();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) })
    );
  });
});
