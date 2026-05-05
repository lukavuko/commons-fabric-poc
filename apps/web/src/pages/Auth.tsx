import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AuthShell, Button, FormField, Input } from "../components";
import { login, register } from "../lib/auth";

type Mode = "signin" | "signup";

interface SignupFields {
  displayName: string;
  firstname: string;
  lastname: string;
  postalCode: string;
  city: string;
  phone: string;
}

const emptySignupFields: SignupFields = {
  displayName: "",
  firstname: "",
  lastname: "",
  postalCode: "",
  city: "",
  phone: "",
};

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupFields, setSignupFields] =
    useState<SignupFields>(emptySignupFields);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  const updateField = (key: keyof SignupFields) => (v: string) =>
    setSignupFields((prev) => ({ ...prev, [key]: v }));

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setSignupComplete(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        await register({
          email,
          password,
          displayName: signupFields.displayName,
          firstname: signupFields.firstname || undefined,
          lastname: signupFields.lastname || undefined,
          postalCode: signupFields.postalCode || undefined,
          city: signupFields.city || undefined,
          phone: signupFields.phone || undefined,
        });
        setSignupComplete(true);
      } else {
        await login(email, password);
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <AuthShell title="Check your email" accent>
        <Alert tone="success">
          We sent a verification link to <strong>{email}</strong>. Click it to
          activate your account, then come back and sign in.
        </Alert>
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() => switchMode("signin")}
        >
          Back to sign in
        </Button>
      </AuthShell>
    );
  }

  const isSignup = mode === "signup";

  return (
    <AuthShell
      title={isSignup ? "Create your account" : "Welcome back"}
      subtitle={
        isSignup
          ? "Free, no spam. We'll send a one-time link to verify your email."
          : "Sign in to subscribe to communities and manage your calendar."
      }
      accent={isSignup}
    >
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

        {isSignup && (
          <FormField
            label="Display name"
            hint="How others will see you in the community."
          >
            {({ id }) => (
              <Input
                id={id}
                type="text"
                autoComplete="nickname"
                required
                value={signupFields.displayName}
                onChange={(e) => updateField("displayName")(e.target.value)}
              />
            )}
          </FormField>
        )}

        <FormField
          label="Password"
          hint={isSignup ? "At least 8 characters." : undefined}
        >
          {({ id }) => (
            <Input
              id={id}
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </FormField>

        {isSignup && (
          <details className="rounded-cf-md bg-[rgba(80,101,72,0.04)] px-3.5 py-2.5 group">
            <summary className="text-xs font-medium text-ink-muted tracking-wide cursor-pointer select-none list-none flex items-center justify-between">
              <span>Optional details</span>
              <span className="text-ink-subtle group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>
            <div className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First name">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="text"
                      autoComplete="given-name"
                      value={signupFields.firstname}
                      onChange={(e) => updateField("firstname")(e.target.value)}
                    />
                  )}
                </FormField>
                <FormField label="Last name">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="text"
                      autoComplete="family-name"
                      value={signupFields.lastname}
                      onChange={(e) => updateField("lastname")(e.target.value)}
                    />
                  )}
                </FormField>
              </div>
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <FormField label="Postal code">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="text"
                      autoComplete="postal-code"
                      value={signupFields.postalCode}
                      onChange={(e) =>
                        updateField("postalCode")(e.target.value)
                      }
                    />
                  )}
                </FormField>
                <FormField label="City">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="text"
                      autoComplete="address-level2"
                      value={signupFields.city}
                      onChange={(e) => updateField("city")(e.target.value)}
                    />
                  )}
                </FormField>
              </div>
              <FormField label="Phone">
                {({ id }) => (
                  <Input
                    id={id}
                    type="tel"
                    autoComplete="tel"
                    value={signupFields.phone}
                    onChange={(e) => updateField("phone")(e.target.value)}
                  />
                )}
              </FormField>
            </div>
          </details>
        )}

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`flex-1 px-4 py-2.5 rounded-cf-pill text-sm font-medium transition-colors ${
            !isSignup
              ? "bg-sage-deep text-surface"
              : "text-ink shadow-[inset_0_0_0_1px_rgba(80,101,72,0.32)] hover:bg-[rgba(80,101,72,0.06)]"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 px-4 py-2.5 rounded-cf-pill text-sm font-medium transition-colors ${
            isSignup
              ? "bg-sage-deep text-surface"
              : "text-ink shadow-[inset_0_0_0_1px_rgba(80,101,72,0.32)] hover:bg-[rgba(80,101,72,0.06)]"
          }`}
        >
          Create account
        </button>
      </div>
    </AuthShell>
  );
}
