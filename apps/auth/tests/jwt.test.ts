import { describe, it, expect } from "vitest";

process.env.JWT_SECRET = "test-secret-that-is-long-enough-32ch";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough-32c";

import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../lib/jwt.js";

describe("access tokens", () => {
  it("signs and verifies an access token", async () => {
    const token = await signAccessToken("user-123");
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe("user-123");
  });

  it("rejects a token signed with the wrong secret", async () => {
    const token = await signRefreshToken("user-123");
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });
});

describe("refresh tokens", () => {
  it("signs and verifies a refresh token", async () => {
    const token = await signRefreshToken("user-456");
    const payload = await verifyRefreshToken(token);
    expect(payload.sub).toBe("user-456");
  });
});
