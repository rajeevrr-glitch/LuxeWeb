import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";
import { ArrowRight } from "lucide-react";
import kitchen from "@/assets/kitchen.jpg";
import bedroom from "@/assets/bedroom.jpg";
import living from "@/assets/living.jpg";
import bathroom from "@/assets/bathroom.jpg";
import wardrobe from "@/assets/wardrobe.jpg";
import dining from "@/assets/dining.jpg";
import kids from "@/assets/kids.jpg";
import office from "@/assets/office.jpg";
import pooja from "@/assets/pooja.jpg";
import foyer from "@/assets/foyer.jpg";
import fullHome from "@/assets/full-home.jpg";

export const Route = createFileRoute("/design-ideas/")({
  head: () => ({
    meta: [
      { title: "Home Interior Design Ideas — Luxe Infra" },
      { name: "description", content: "Explore curated interior design ideas for kitchens, bedrooms, living rooms, bathrooms and more from Luxe Infra." },
      { property: "og:title", content: "Design Ideas — Luxe Infra" },
      { property: "og:description", content: "Curated interior design inspiration for every room." },
    ],
  }),
  component: DesignIdeas,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => <RouteNotFound />,
});

const items = [
  { slug: "kitchen", img: kitchen, title: "Modular Kitchen", count: "10 Designs" },
  { slug: "bedroom", img: bedroom, title: "Master Bedroom", count: "10 Designs" },
  { slug: "living", img: living, title: "Living Room", count: "10 Designs" },
  { slug: "bathroom", img: bathroom, title: "Bathroom", count: "10 Designs" },
  { slug: "wardrobe", img: wardrobe, title: "Wardrobe", count: "10 Designs" },
  { slug: "dining", img: dining, title: "Dining Room", count: "10 Designs" },
  { slug: "kids", img: kids, title: "Kids Bedroom", count: "10 Designs" },
  { slug: "office", img: office, title: "Home Office", count: "10 Designs" },
  { slug: "pooja", img: pooja, title: "Pooja Room", count: "10 Designs" },
  { slug: "foyer", img: foyer, title: "Foyer", count: "10 Designs" },
  { slug: "full-home", img: fullHome, title: "Full Home", count: "10 Designs" },
];

function DesignIdeas() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / Design Ideas</p>
        <div className="mt-6 flex items-center gap-3">
          <span className="h-8 w-1 rounded bg-primary" />
          <h1 className="font-display text-5xl md:text-6xl">Home Interior Design</h1>
        </div>
        <p className="mt-5 max-w-3xl text-muted-foreground">
          Find a direction that feels like you. Explore the supplied inspiration collection and save your favourite designs to your project brief.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.title}
              to="/design-ideas/$category"
              params={{ category: c.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={c.img} alt={c.title} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-display text-xl">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.count}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}


