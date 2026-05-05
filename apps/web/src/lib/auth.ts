const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? "http://localhost:4001";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Login failed");
  }
  const tokens = (await res.json()) as AuthTokens;
  localStorage.setItem("access_token", tokens.accessToken);
  localStorage.setItem("refresh_token", tokens.refreshToken);
  return tokens;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    await fetch(`${AUTH_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  const res = await fetch(`${AUTH_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const { accessToken } = (await res.json()) as { accessToken: string };
  localStorage.setItem("access_token", accessToken);
  return accessToken;
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(
    `${AUTH_URL}/auth/verify-email/${encodeURIComponent(token)}`,
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
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Could not resend verification",
    );
  }
}
