import { Link } from "react-router-dom";
import { SiteNav } from "@/components/SiteNav";
import { LinkButton } from "@/components/primitives";
import { useMe } from "@/lib/useMe";

export default function Welcome() {
  const me = useMe();

  return (
    <div className="max-w-[1200px] w-full mx-auto px-8 flex-1 flex flex-col">
      <SiteNav />

      <main className="flex-1 flex flex-col">
        {/* Hero — Z-trace starts here, top-left of content area */}
        <section className="grid md:grid-cols-[1.2fr_1fr] gap-12 items-center py-12 md:py-20">
          <div>
            <p className="text-sm text-sage-deep font-medium mb-4 tracking-wide uppercase">
              Federated, calendar-first, ad-free
            </p>
            <h1 className="font-display text-5xl md:text-6xl font-medium text-ink leading-[1.05] tracking-tight mb-6">
              Stay in touch with the people you live near.
            </h1>
            <p className="text-lg text-ink-muted max-w-[480px] mb-8 leading-relaxed">
              Commons Fabric is a quiet place to discover local communities,
              follow their events, and choose how — and how often — you want to
              hear from them.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton variant="primary" to="/explore">
                Explore communities
              </LinkButton>
              {!me.isAuthenticated && (
                <LinkButton variant="secondary" to="/auth">
                  Create an account
                </LinkButton>
              )}
            </div>
            {!me.isAuthenticated && (
              <p className="text-xs text-ink-muted mt-4">
                No account required to browse.{" "}
                <Link
                  to="/explore"
                  className="underline underline-offset-2 hover:text-sage-deep"
                >
                  Skip ahead
                </Link>
                .
              </p>
            )}
          </div>

          {/* Decorative botanical composition — purely cosmetic */}
          <div aria-hidden className="relative h-72 md:h-96">
            <div
              className="absolute right-0 top-4 w-56 h-56 bg-[linear-gradient(135deg,#9CAE92,#B6C5A8)]"
              style={{ borderRadius: "60% 40% 65% 35% / 50% 60% 40% 50%" }}
            />
            <div
              className="absolute left-2 bottom-0 w-40 h-40 bg-[linear-gradient(135deg,#C49A82,#D8B499)] opacity-90"
              style={{ borderRadius: "55% 45% 40% 60% / 60% 40% 60% 40%" }}
            />
            <div
              className="absolute right-16 bottom-8 w-24 h-24 bg-[linear-gradient(135deg,#9CAE92,#E4C26A)] opacity-80"
              style={{ borderRadius: "50% 50% 45% 55% / 55% 45% 55% 45%" }}
            />
          </div>
        </section>

        {/* Three "what you get" panels — light, low-contrast surface tiles */}
        <section className="grid md:grid-cols-3 gap-5 mb-16">
          {[
            {
              title: "For neighbours",
              body: "Browse communities near you on a map or in a quiet gallery. Subscribe with just an email — or skip the email entirely.",
            },
            {
              title: "For members",
              body: "RSVP to events, comment on announcements, and choose how you'd like to be notified. Real-time, daily digest, weekly — your call.",
            },
            {
              title: "For stewards",
              body: "Run your group's calendar, post announcements, and govern your membership. Federated, autonomous, and yours.",
            },
          ].map((panel) => (
            <article
              key={panel.title}
              className="bg-surface rounded-cf-xl p-6 shadow-cf-card"
            >
              <h2 className="font-display text-xl font-medium text-ink mb-2">
                {panel.title}
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                {panel.body}
              </p>
            </article>
          ))}
        </section>

        <footer className="text-xs text-ink-muted text-center py-10">
          Commons Fabric · proof of concept · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
