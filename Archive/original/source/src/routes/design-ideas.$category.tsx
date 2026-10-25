import { createFileRoute, Link, notFound, isNotFound } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SafeImage } from "@/components/SafeImage";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";
import { ArrowLeft } from "lucide-react";

const allImages = import.meta.glob("/src/assets/ideas/**/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const categories: Record<string, { title: string; blurb: string }> = {
  kitchen: { title: "Modular Kitchen", blurb: "Smart, stylish and functional modular kitchen designs crafted to fit your space and lifestyle." },
  bedroom: { title: "Master Bedroom", blurb: "Calm, luxurious bedroom interiors with bespoke storage and layered lighting." },
  living: { title: "Living Room", blurb: "Statement living rooms blending comfort, finishes and conversation-friendly layouts." },
  bathroom: { title: "Bathroom", blurb: "Spa-inspired bathrooms with premium fittings and timeless materials." },
  wardrobe: { title: "Wardrobe", blurb: "Wall-to-wall and walk-in wardrobes with intelligent organisation." },
  dining: { title: "Dining Room", blurb: "Warm, hospitable dining spaces designed for everyday dinners and special occasions." },
  kids: { title: "Kids Bedroom", blurb: "Playful, safe and growing-with-them kids bedroom designs." },
  office: { title: "Home Office", blurb: "Focused, ergonomic home offices that look as good as they perform." },
  pooja: { title: "Pooja Room", blurb: "Serene, sacred pooja spaces with handcrafted detailing." },
  foyer: { title: "Foyer", blurb: "First-impression foyers with statement lighting and bespoke storage." },
  "full-home": { title: "Full Home", blurb: "End-to-end full home interiors — design, manufacture and installation handled by Luxe Infra." },
};

export const Route = createFileRoute("/design-ideas/$category")({
  loader: ({ params }): { meta: { title: string; blurb: string }; images: string[] } => {
    const meta = categories[params.category];
    if (!meta) throw notFound();

    let images: string[] = [];
    try {
      const prefix = `/src/assets/ideas/${params.category}/`;
      images = Object.entries(allImages)
        .filter(([k]) => k.startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, url]) => url);
    } catch (error) {
      // A gallery hiccup shouldn't take the whole page down — show the page without images.
      console.error(error);
      images = [];
    }

    return { meta, images };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.meta.title} Design Ideas — Luxe Infra` },
          { name: "description", content: loaderData.meta.blurb },
          { property: "og:title", content: `${loaderData.meta.title} — Luxe Infra` },
          { property: "og:description", content: loaderData.meta.blurb },
          ...(loaderData.images[0] ? [{ property: "og:image", content: loaderData.images[0] }] : []),
        ]
      : [],
  }),
  component: CategoryPage,
  errorComponent: ({ error, reset }) =>
    isNotFound(error) ? (
      <RouteNotFound title="Category not found" description="We couldn't find that design category." />
    ) : (
      <RouteErrorFallback error={error} reset={reset} title="This gallery didn't load" />
    ),
  notFoundComponent: () => (
    <RouteNotFound title="Category not found" description="We couldn't find that design category." />
  ),
});

function CategoryPage() {
  const { meta, images } = Route.useLoaderData();
  const { category } = Route.useParams();
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link> /{" "}
          <Link to="/design-ideas" className="hover:text-primary">Design Ideas</Link> / {meta.title}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <span className="h-8 w-1 rounded bg-primary" />
          <h1 className="font-display text-5xl md:text-6xl">{meta.title}</h1>
        </div>
        <p className="mt-5 max-w-3xl text-muted-foreground">{meta.blurb}</p>

        {images.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-card p-8">
            <p className="font-display text-2xl">Designs coming soon</p>
            <p className="mt-2 text-muted-foreground">
              We're photographing this collection right now. Call us on{" "}
              <a href="tel:9026271638" className="text-primary hover:underline">90262 71638</a> and we'll share them directly.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((src: string, i: number) => (
              <figure key={src} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SafeImage src={src} alt={`${meta.title} design ${i + 1}`} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <figcaption className="flex items-center justify-between p-5">
                  <span className="font-display text-lg">Design {String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm text-muted-foreground capitalize">{category.replace("-", " ")}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="mt-16">
          <Link to="/design-ideas" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to all categories
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
