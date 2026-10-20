import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { PageShell } from "./PageShell";

/** Turns any thrown value into a calm, human sentence. */
export function friendlyErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (!msg) return "Something didn't load the way it should.";
    if (/fetch|network|failed to load/i.test(msg)) {
      return "We couldn't reach our servers. Please check your connection and try again.";
    }
    if (/timeout/i.test(msg)) return "That took too long to respond. Please try again.";
    return msg.length > 160 ? "Something didn't load the way it should." : msg;
  }
  return "Something didn't load the way it should.";
}

export function RouteErrorFallback({
  error,
  reset,
  title = "This page didn't load",
}: {
  error?: unknown;
  reset?: () => void;
  title?: string;
}) {
  const router = useRouter();

  if (error) console.error(error);

  return (
    <PageShell>
      <section className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
        <div className="rounded-2xl bg-accent p-4 text-primary">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-4xl">{title}</h1>
        <p className="mt-4 text-muted-foreground">{friendlyErrorMessage(error)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              try {
                router.invalidate();
                reset?.();
              } catch (e) {
                console.error(e);
                window.location.reload();
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-accent"
          >
            <Home className="h-4 w-4" /> Go home
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Still stuck? Call us on{" "}
          <a href="tel:9026271638" className="text-primary hover:underline">
            90262 71638
          </a>
          .
        </p>
      </section>
    </PageShell>
  );
}

export function RouteNotFound({
  title = "Page not found",
  description = "The page you're looking for doesn't exist or has moved.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <PageShell>
      <section className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="font-display text-6xl text-primary">404</p>
        <h1 className="mt-4 font-display text-4xl">{title}</h1>
        <p className="mt-4 text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]"
          >
            Go home
          </Link>
          <Link
            to="/design-ideas"
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent"
          >
            Browse design ideas
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
