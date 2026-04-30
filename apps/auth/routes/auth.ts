import { Router } from "express";
import { randomBytes } from "crypto";
import { prisma } from "@cfp/db";
import { hashPassword, verifyPassword, hashToken } from "../lib/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { sendVerificationEmail } from "../lib/email.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await hashPassword(password);
  const emailVerificationToken = randomBytes(32).toString("hex");
  const username = email.split("@")[0];

  await prisma.user.create({
    data: { email, username, passwordHash, emailVerificationToken },
  });

  await sendVerificationEmail(email, emailVerificationToken);
  return res.status(201).json({ message: "Verification email sent" });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = await signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastloginAt: new Date() },
  });

  return res.json({ accessToken, refreshToken });
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ error: "refreshToken is required" });

  let userId: string;
  try {
    const payload = await verifyRefreshToken(refreshToken);
    userId = payload.sub;
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findUnique({ where: { refreshToken: tokenHash } });

  if (!session || session.userId !== userId || session.expiresAt < new Date()) {
    return res.status(401).json({ error: "Session not found or expired" });
  }

  const accessToken = await signAccessToken(userId);
  return res.json({ accessToken });
});

authRouter.post("/logout", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.session.deleteMany({ where: { refreshToken: tokenHash } });
  }
  return res.json({ message: "Logged out" });
});

authRouter.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;
  const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), emailVerificationToken: null },
  });

  return res.json({ message: "Email verified" });
});
