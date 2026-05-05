import { Link, useLocation } from "react-router-dom";
import { useMe } from "@/lib/useMe";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/explore", label: "Explore" },
  { href: "/calendar", label: "Calendar" },
  { href: "/feed", label: "Feed" },
];

export function SiteNav() {
  const { pathname } = useLocation();
  const me = useMe();

  const displayName = me.user?.firstname ?? me.user?.displayName ?? "You";

  const initials = (
    me.user?.firstname?.[0] ??
    me.user?.displayName?.[0] ??
    "Y"
  ).toUpperCase();

  return (
    <nav
      aria-label="Primary"
      className="flex items-center justify-between py-7 mb-8"
    >
      <Link
        to="/"
        className="flex items-center gap-2.5 group"
        aria-label="Commons Fabric — home"
      >
        <span
          aria-hidden
          className="block w-7 h-7 bg-sage rounded-[14px_14px_14px_4px] -rotate-12 transition-transform group-hover:rotate-0"
        />
        <span className="font-display text-xl font-medium text-ink tracking-tight">
          Commons Fabric
        </span>
      </Link>

      <ul className="flex items-center gap-1">
        {NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`px-4 py-2 rounded-cf-pill text-sm transition-colors ${
                  isActive
                    ? "bg-[rgba(80,101,72,0.14)] text-ink"
                    : "text-ink-muted hover:text-ink hover:bg-[rgba(47,53,44,0.04)]"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}

        <li>
          {!me.loading && !me.isAuthenticated ? (
            <Link
              to="/auth"
              className="ml-2 px-4 py-2 rounded-cf-pill text-sm font-medium text-sage-deep shadow-[inset_0_0_0_1px_rgba(80,101,72,0.45)] hover:bg-[rgba(80,101,72,0.06)] transition-colors"
            >
              Sign in
            </Link>
          ) : me.isAuthenticated ? (
            <Link
              to="/you"
              aria-current={pathname === "/you" ? "page" : undefined}
              className={`ml-2 flex items-center gap-2 px-3 py-1.5 rounded-cf-pill text-sm transition-colors ${
                pathname === "/you"
                  ? "bg-[rgba(80,101,72,0.14)] text-ink"
                  : "text-ink-muted hover:text-ink hover:bg-[rgba(47,53,44,0.04)]"
              }`}
            >
              <span
                aria-hidden
                className="w-6 h-6 rounded-full bg-sage-deep text-surface text-xs font-semibold flex items-center justify-center shrink-0"
              >
                {initials}
              </span>
              {displayName}
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}
