import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";
import fullHome from "@/assets/full-home.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Luxe Infra — Interior Design Studio" },
      { name: "description", content: "Luxe Infra is a premium interior design studio crafting beautiful, functional homes across India." },
      { property: "og:title", content: "About — Luxe Infra" },
      { property: "og:description", content: "A premium interior design studio." },
    ],
  }),
  component: About,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => <RouteNotFound />,
});

function About() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / About</p>
        <div className="mt-6 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-5xl md:text-6xl">Designing homes that <span className="italic text-primary">feel like you.</span></h1>
            <p className="mt-6 text-muted-foreground">
              Luxe Infra is a premium interior design studio building thoughtful, beautiful homes across India. We blend timeless design with smart functionality — and back every project with premium materials, master craftsmanship and a 10-year warranty.
            </p>
            <p className="mt-4 text-muted-foreground">
              From modular kitchens to full home transformations, our designers work side by side with you to deliver spaces that look stunning and live even better.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-8">
              <div><div className="font-display text-3xl text-primary">500+</div><div className="text-xs uppercase tracking-wider text-muted-foreground">Homes</div></div>
              <div><div className="font-display text-3xl text-primary">12+</div><div className="text-xs uppercase tracking-wider text-muted-foreground">Cities</div></div>
              <div><div className="font-display text-3xl text-primary">4.9★</div><div className="text-xs uppercase tracking-wider text-muted-foreground">Rating</div></div>
            </div>
          </div>
          <img src={fullHome} alt="Interior" loading="lazy" width={1024} height={768} className="rounded-3xl shadow-[var(--shadow-elegant)]" />
        </div>
      </section>
    </PageShell>
  );
}
