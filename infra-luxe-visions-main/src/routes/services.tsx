import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";
import { ChefHat, Bed, Sofa, Bath, Archive, Lightbulb, Paintbrush, Home } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Interior Design Services — Luxe Infra" },
      { name: "description", content: "Modular kitchens, wardrobes, full home interiors, false ceilings, lighting and more. End-to-end interior services by Luxe Infra." },
      { property: "og:title", content: "Services — Luxe Infra" },
      { property: "og:description", content: "End-to-end interior design and execution services." },
    ],
  }),
  component: Services,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => <RouteNotFound />,
});

const services = [
  { icon: ChefHat, title: "Modular Kitchens", desc: "Custom layouts with premium finishes, smart storage and 10-year warranty." },
  { icon: Archive, title: "Wardrobes & Storage", desc: "Sliding, hinged, walk-in — designed to fit your space and lifestyle." },
  { icon: Home, title: "Full Home Interiors", desc: "End-to-end design and execution with a 45-day handover promise." },
  { icon: Sofa, title: "Living & Dining", desc: "Statement furniture, accent walls and lighting that elevate everyday living." },
  { icon: Bed, title: "Bedrooms", desc: "Restful master bedrooms, kids' rooms and guest spaces — every detail considered." },
  { icon: Bath, title: "Bathrooms", desc: "Spa-inspired bathrooms with premium fittings and durable finishes." },
  { icon: Lightbulb, title: "False Ceilings & Lighting", desc: "Layered lighting design and ceiling treatments that transform rooms." },
  { icon: Paintbrush, title: "Civil, Painting & Decor", desc: "Civil work, painting and curated decor — handled under one roof." },
];

function Services() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / Services</p>
        <h1 className="mt-6 font-display text-5xl md:text-6xl">Our Services</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Everything you need to design, build and finish a beautiful home — managed by one team, delivered on time.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.title} className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/40">
              <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary"><s.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.42_0.20_260)] p-10 text-primary-foreground md:p-14">
          <h2 className="font-display text-3xl md:text-4xl">How we work</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-4">
            {["Consult", "Design", "Execute", "Handover"].map((step, i) => (
              <div key={step}>
                <div className="font-display text-5xl text-[var(--gold)]">0{i + 1}</div>
                <div className="mt-2 font-semibold">{step}</div>
                <div className="mt-1 text-sm text-primary-foreground/80">
                  {i === 0 && "Free in-home or online consultation."}
                  {i === 1 && "3D designs and detailed quote in 48 hours."}
                  {i === 2 && "Premium materials, expert craftsmanship."}
                  {i === 3 && "On-time handover with 10-year warranty."}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
