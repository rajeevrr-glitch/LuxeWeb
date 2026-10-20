import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";
import living from "@/assets/living.jpg";
import bedroom from "@/assets/bedroom.jpg";
import kitchen from "@/assets/kitchen.jpg";
import bathroom from "@/assets/bathroom.jpg";
import dining from "@/assets/dining.jpg";
import fullHome from "@/assets/full-home.jpg";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Luxe Infra" },
      { name: "description", content: "Real homes designed and delivered by Luxe Infra. Browse our completed interior projects." },
      { property: "og:title", content: "Projects — Luxe Infra" },
      { property: "og:description", content: "A portfolio of completed homes by Luxe Infra." },
    ],
  }),
  component: Projects,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => <RouteNotFound />,
});

const projects = [
  { img: living, title: "The Arched Apartment", meta: "3 BHK · Lucknow" },
  { img: bedroom, title: "Walnut Retreat", meta: "Master Bedroom · Delhi" },
  { img: kitchen, title: "Stone & Brass Kitchen", meta: "Modular Kitchen · Mumbai" },
  { img: bathroom, title: "Marble & Teak Bath", meta: "Bathroom · Bengaluru" },
  { img: dining, title: "Heritage Dining", meta: "Dining Room · Kolkata" },
  { img: fullHome, title: "Open-Plan Family Home", meta: "Full Home · Pune" },
];

function Projects() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / Projects</p>
        <h1 className="mt-6 font-display text-5xl md:text-6xl">Our Projects</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">A glimpse into homes we've designed and delivered across India.</p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {projects.map((p, i) => (
            <article key={p.title} className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] ${i % 3 === 0 ? "md:col-span-2" : ""}`}>
              <div className="relative overflow-hidden">
                <img src={p.img} alt={p.title} loading="lazy" width={1024} height={768} className={`w-full object-cover transition duration-700 group-hover:scale-105 ${i % 3 === 0 ? "aspect-[21/9]" : "aspect-[4/3]"}`} />
              </div>
              <div className="p-6">
                <div className="text-xs uppercase tracking-wider text-primary">{p.meta}</div>
                <h3 className="mt-1 font-display text-2xl">{p.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
