import { Router, type Response } from "express";
import { randomBytes } from "crypto";
import { prisma } from "@cfp/db";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@cfp/auth-tokens";
import { sendVerificationEmail } from "../lib/email.js";

export const authRouter = Router();

const refreshCookieName = "cfp_refresh_token";
const refreshCookieMaxAgeMs = 30 * 24 * 60 * 60 * 1000;

function getRefreshTokenCookie(cookieHeader: string | undefined) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${refreshCookieName}=`;
  const cookie = cookies.find((value) => value.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth",
    maxAge: refreshCookieMaxAgeMs,
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth",
  });
}

function isPrismaKnownError(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

authRouter.post("/register", async (req, res) => {
  let createdUserId: string | null = null;
  try {
    const {
      email,
      password,
      displayName,
      firstname,
      lastname,
      postalCode,
      city,
      phone,
    } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
      firstname?: string;
      lastname?: string;
      postalCode?: string;
      city?: string;
      phone?: string;
    };
    if (!email || !password || !displayName) {
      return res
        .status(400)
        .json({ error: "email, password and displayName are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await hashPassword(password);
    const emailVerificationToken = randomBytes(32).toString("hex");
    const username = email.split("@")[0];

    const trimOrNull = (v?: string) => {
      const t = v?.trim();
      return t ? t : null;
    };

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: displayName.trim(),
        passwordHash,
        emailVerificationToken,
        firstname: trimOrNull(firstname),
        lastname: trimOrNull(lastname),
        postalCode: trimOrNull(postalCode),
        city: trimOrNull(city),
        phone: trimOrNull(phone),
      },
    });
    createdUserId = user.id;

    await sendVerificationEmail(email, emailVerificationToken);
    return res.status(201).json({ message: "Verification email sent" });
  } catch (error) {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
    if (isPrismaKnownError(error, "P2002")) {
      return res.status(409).json({ error: "Email already registered" });
    }
    return res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash)
    return res.status(401).json({ error: "Invalid credentials" });

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

  setRefreshTokenCookie(res, refreshToken);
  return res.json({ accessToken });
});

authRouter.post("/refresh", async (req, res) => {
  const refreshToken = getRefreshTokenCookie(req.headers.cookie);
  if (!refreshToken)
    return res.status(400).json({ error: "refreshToken is required" });

  let userId: string;
  try {
    const payload = await verifyRefreshToken(refreshToken);
    userId = payload.sub;
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findUnique({
    where: { refreshToken: tokenHash },
  });

  if (!session || session.userId !== userId || session.expiresAt < new Date()) {
    return res.status(401).json({ error: "Session not found or expired" });
  }

  const accessToken = await signAccessToken(userId);
  return res.json({ accessToken });
});

authRouter.post("/logout", async (req, res) => {
  const refreshToken = getRefreshTokenCookie(req.headers.cookie);
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.session.deleteMany({ where: { refreshToken: tokenHash } });
  }
  clearRefreshTokenCookie(res);
  return res.json({ message: "Logged out" });
});

authRouter.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;
  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), emailVerificationToken: null },
  });

  return res.json({ message: "Email verified" });
});

authRouter.post("/resend-verification", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: "email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  // Do not leak account existence — always return 200 unless the body is malformed.
  if (!user)
    return res.json({
      message: "If the account exists, a verification email has been sent",
    });
  if (user.emailVerifiedAt) {
    return res.json({ message: "Email is already verified" });
  }

  const emailVerificationToken = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken },
  });
  await sendVerificationEmail(email, emailVerificationToken);

  return res.json({ message: "Verification email sent" });
});
