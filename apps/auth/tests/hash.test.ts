import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, hashToken } from "@cfp/auth-tokens";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies correctly", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });
});

describe("hashToken", () => {
  it("produces a deterministic SHA-256 hex string", () => {
    expect(hashToken("my-token")).toBe(hashToken("my-token"));
    expect(hashToken("my-token")).toHaveLength(64);
  });

  it("different inputs produce different hashes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});
