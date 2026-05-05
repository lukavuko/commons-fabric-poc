import {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  useId,
} from "react";
import { Link, type LinkProps } from "react-router-dom";

type TagTone = "sage" | "clay" | "neutral";

export function Tag({
  children,
  tone = "sage",
}: {
  children: ReactNode;
  tone?: TagTone;
}) {
  const palette = {
    sage: "bg-[rgba(80,101,72,0.12)] text-sage-deep",
    clay: "bg-[rgba(140,90,63,0.12)] text-clay-deep",
    neutral: "bg-[rgba(47,53,44,0.06)] text-ink-muted",
  }[tone];

  return (
    <span
      className={`${palette} text-xs px-2.5 py-1 rounded-cf-pill leading-none`}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ label = "Verified" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-sage-deep font-medium">
      <span aria-hidden className="w-1.5 h-1.5 rounded-cf-pill bg-sage-deep" />
      {label}
    </span>
  );
}

export function StateBadge({
  label,
  tone = "clay",
}: {
  label: string;
  tone?: "clay" | "sage";
}) {
  const palette =
    tone === "clay"
      ? "text-clay-deep bg-[rgba(140,90,63,0.10)]"
      : "text-sage-deep bg-[rgba(80,101,72,0.10)]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${palette} px-2.5 py-1 rounded-cf-pill font-medium`}
    >
      {label}
    </span>
  );
}

type Variant = "primary" | "secondary" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "bg-sage-deep text-surface hover:bg-[#3E4D38] active:bg-[#3E4D38]",
  secondary:
    "bg-transparent text-ink shadow-[inset_0_0_0_1px_rgba(80,101,72,0.32)] hover:bg-[rgba(80,101,72,0.06)]",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-[rgba(47,53,44,0.04)]",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-cf-pill text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      {...rest}
    />
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...rest
}: LinkProps & { variant?: Variant }) {
  return (
    <Link
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      {...rest}
    />
  );
}

const inputBase =
  "w-full bg-page rounded-cf-md px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle " +
  "shadow-[inset_0_0_0_1px_var(--cf-hairline)] " +
  "focus:shadow-[inset_0_0_0_1px_rgba(80,101,72,0.45)] " +
  "transition-shadow disabled:opacity-50 disabled:cursor-not-allowed";

export function Input({
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function Textarea({
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${inputBase} resize-y min-h-[80px] ${className}`}
      {...rest}
    />
  );
}

export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string }) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium text-ink-muted tracking-wide"
      >
        {label}
      </label>
      {children({ id })}
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      {error && (
        <p className="text-xs text-[color:var(--cf-danger)]">{error}</p>
      )}
    </div>
  );
}

export function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "info" | "success";
  children: ReactNode;
}) {
  const palette = {
    danger: "bg-[rgba(181,80,63,0.08)] text-[color:var(--cf-danger)]",
    info: "bg-[rgba(80,101,72,0.08)] text-sage-deep",
    success: "bg-[rgba(80,101,72,0.10)] text-sage-deep",
  }[tone];
  return (
    <div className={`${palette} text-sm rounded-cf-md px-3.5 py-2.5`}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "article",
}: {
  children: ReactNode;
  className?: string;
  as?: "article" | "section" | "div" | "li";
}) {
  return (
    <Tag
      className={`bg-surface rounded-cf-xl shadow-cf-card flex flex-col p-6 transition-shadow hover:shadow-cf-card-hover ${className}`}
    >
      {children}
    </Tag>
  );
}
