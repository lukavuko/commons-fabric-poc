import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "./primitives";

export function AuthShell({
  title,
  subtitle,
  accent = false,
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="font-display text-xl text-ink hover:text-sage-deep transition-colors"
          >
            Commons Fabric
          </Link>
        </div>
        <div
          className="relative"
          style={
            accent
              ? {
                  filter:
                    "drop-shadow(0 0 0 rgba(228,194,106,0)) drop-shadow(0 18px 40px rgba(228,194,106,0.22))",
                }
              : undefined
          }
        >
          {accent && (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 rounded-t-cf-xl"
              style={{
                background:
                  "linear-gradient(90deg, var(--cf-sage) 0%, var(--cf-sun) 50%, var(--cf-clay) 100%)",
              }}
            />
          )}
          <Card className={`!p-8 gap-5 ${accent ? "!bg-[#FCF8EC]" : ""}`}>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-2xl text-ink">{title}</h1>
              {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
            </div>
            {children}
          </Card>
        </div>
      </div>
    </main>
  );
}
