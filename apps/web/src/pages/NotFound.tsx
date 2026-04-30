import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-medium text-ink mb-2">
        Not found
      </h1>
      <p className="text-ink-muted mb-6">
        We couldn't find the page you were looking for.
      </p>
      <Link
        to="/"
        className="text-sm text-sage-deep underline underline-offset-2 hover:text-[#3E4D38]"
      >
        Back to home
      </Link>
    </main>
  );
}
