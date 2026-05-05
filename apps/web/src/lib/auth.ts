const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? "";

let accessToken: string | null = null;

try {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
} catch {
  // Storage can be unavailable in stricter browser contexts.
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  firstname?: string;
  lastname?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
}

export async function register(input: RegisterInput): Promise<void> {
  const res = await fetch(`${AUTH_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Registration failed",
    );
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Login failed");
  }
  const tokens = (await res.json()) as AuthTokens;
  accessToken = tokens.accessToken;
  return tokens;
}

export async function logout(): Promise<void> {
  await fetch(`${AUTH_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  accessToken = null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${AUTH_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    accessToken = null;
    return null;
  }
  const body = (await res.json()) as { accessToken: string };
  accessToken = body.accessToken;
  return body.accessToken;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(
    `${AUTH_URL}/auth/verify-email/${encodeURIComponent(token)}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Verification failed",
    );
  }
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${AUTH_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Could not resend verification",
    );
  }
}
