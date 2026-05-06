import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, FormField, Input } from "@/components/primitives";
import { AuthShell } from "@/components/AuthShell";
import { resendVerification, verifyEmail } from "@/lib/auth";

type Status = "verifying" | "success" | "error" | "missing-token";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [status, setStatus] = useState<Status>(
    token ? "verifying" : "missing-token",
  );
  const [errorMessage, setErrorMessage] = useState("");
  // The token is single-use: the first call clears it, so a StrictMode
  // double-mount would make the second call always fail with "invalid".
  // Ref guard ensures we fire exactly once per mounted token.
  const verifiedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;
    if (verifiedTokenRef.current === token) return;
    verifiedTokenRef.current = token;
    (async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Verification failed",
        );
        setStatus("error");
      }
    })();
  }, [token]);

  if (status === "verifying") {
    return (
      <AuthShell title="Verifying your email…">
        <p className="text-sm text-ink-muted">One moment.</p>
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell
        title="You're verified"
        subtitle="Your email is confirmed. You can now subscribe to communities and create events."
      >
        <Button onClick={() => navigate("/auth")} className="mt-2">
          Continue to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verification link is invalid"
      subtitle="The link may have expired or been used already. Enter your email and we'll send a new one."
    >
      {status === "error" && errorMessage && (
        <Alert tone="danger">{errorMessage}</Alert>
      )}
      <ResendForm />
    </AuthShell>
  );
}

function ResendForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await resendVerification(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Alert tone="success">
        If an account exists for <strong>{email}</strong>, a fresh verification
        link is on its way.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Email">
        {({ id }) => (
          <Input
            id={id}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </FormField>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" disabled={submitting} className="mt-2">
        {submitting ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  );
}
