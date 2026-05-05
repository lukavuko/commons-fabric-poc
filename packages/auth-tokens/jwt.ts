import { SignJWT, jwtVerify } from "jose";

const accessSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);
const refreshSecret = () =>
  new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3h")
    .sign(accessSecret());
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(refreshSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, accessSecret());
  if (!payload.sub) throw new Error("Missing sub claim");
  return { sub: payload.sub };
}

export async function verifyRefreshToken(
  token: string,
): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, refreshSecret());
  if (!payload.sub) throw new Error("Missing sub claim");
  return { sub: payload.sub };
}
