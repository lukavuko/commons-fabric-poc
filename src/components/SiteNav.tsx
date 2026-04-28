import { Link, useLocation } from "react-router-dom";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/explore", label: "Explore" },
  { href: "/calendar", label: "Calendar" },
  { href: "/feed", label: "Feed" },
  { href: "/you", label: "You" },
];

export function SiteNav() {
  const { pathname } = useLocation();

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
      </ul>
    </nav>
  );
}
