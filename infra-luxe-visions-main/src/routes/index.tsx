import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RouteErrorFallback, RouteNotFound } from "@/components/RouteError";
import { ArrowRight, Sparkles, ShieldCheck, Hammer, Clock, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero-living.jpg";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luxe Infra — Premium Interior Design & Home Interiors" },
      { name: "description", content: "Luxe Infra crafts modern, beautiful interiors — modular kitchens, wardrobes, full home interiors and more. Book a free design consultation." },
      { property: "og:title", content: "Luxe Infra — Premium Interior Design" },
      { property: "og:description", content: "End-to-end interior design for modern Indian homes." },
    ],
  }),
  component: HomePage,
  errorComponent: ({ error, reset }) => <RouteErrorFallback error={error} reset={reset} />,
  notFoundComponent: () => <RouteNotFound />,
});

const categories = [
  { img: kitchen, title: "Modular Kitchen", count: "320+ Designs" },
  { img: bedroom, title: "Master Bedroom", count: "280+ Designs" },
  { img: living, title: "Living Room", count: "240+ Designs" },
  { img: bathroom, title: "Bathroom", count: "150+ Designs" },
  { img: wardrobe, title: "Wardrobe", count: "180+ Designs" },
  { img: dining, title: "Dining Room", count: "120+ Designs" },
  { img: kids, title: "Kids Bedroom", count: "90+ Designs" },
  { img: office, title: "Home Office", count: "70+ Designs" },
  { img: pooja, title: "Pooja Room", count: "60+ Designs" },
  { img: foyer, title: "Foyer", count: "45+ Designs" },
  { img: fullHome, title: "Full Home", count: "50+ Designs" },
];

const usp = [
  { icon: Sparkles, title: "Bespoke Design", desc: "Personalized interiors tailored to how you live." },
  { icon: ShieldCheck, title: "Upto 5-Year Warranty", desc: "On all modular kitchens and wardrobes." },
  { icon: Hammer, title: "Quality Craftsmanship", desc: "Premium materials, precision execution." },
  { icon: Clock, title: "On-Time Delivery", desc: "45-day handover for full home interiors." },
];

function HomePage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Premium Interior Design
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-foreground md:text-6xl lg:text-7xl">
              Interiors built around <span className="italic text-primary">your life.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              From modular kitchens to full home makeovers, Luxe Infra designs and delivers spaces that feel timeless, functional and unmistakably yours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-90">
                Book Free Consultation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/design-ideas" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold transition hover:bg-accent">
                Explore Design Ideas
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-8 border-t border-border pt-8">
              <div><div className="font-display text-3xl text-primary">50+</div><div className="text-xs uppercase tracking-wider text-muted-foreground">Homes Designed</div></div>
              <div><div className="font-display text-3xl text-primary">Upto 5 Yr</div><div className="text-xs uppercase tracking-wider text-muted-foreground">Warranty</div></div>
              <div><div className="font-display text-3xl text-primary">45 Day</div><div className="text-xs uppercase tracking-wider text-muted-foreground">Handover</div></div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-[var(--gold)]/20 blur-2xl" />
            <img src={heroImg} alt="Luxury living room interior" width={1600} height={1024} className="rounded-3xl shadow-[var(--shadow-elegant)]" />
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Trusted Rating</div>
              <div className="mt-1 font-display text-2xl">4.9 / 5 ★</div>
              <div className="text-xs text-muted-foreground">From 500+ happy homes</div>
            </div>
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-4">
          {usp.map((u) => (
            <div key={u.title} className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><u.icon className="h-5 w-5" /></div>
              <div>
                <div className="font-semibold">{u.title}</div>
                <div className="text-sm text-muted-foreground">{u.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Design Ideas */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Design Ideas</span>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Home Interior Design</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Carefully-curated interiors for every room. Explore designs that blend luxury, function and personality — built for the way India lives today.
            </p>
          </div>
          <Link to="/design-ideas" className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline md:inline-flex">
            View all ideas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 9).map((c) => (
            <article key={c.title} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={c.img} alt={c.title} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[var(--gradient-overlay)]" />
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-display text-xl">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.count}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary transition group-hover:translate-x-1" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Showcase split */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <img src={fullHome} alt="Full home interior" loading="lazy" width={1024} height={768} className="rounded-3xl" />
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--gold)]">Full Home Interiors</span>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">One designer. One team. One beautiful home.</h2>
            <p className="mt-4 text-primary-foreground/80">
              Our end-to-end service covers everything — from layout planning and modular work to lighting, false ceilings, painting and decor. You get a single point of contact and a 45-day handover promise.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-primary-foreground/90 sm:grid-cols-2">
              <li>• Modular Kitchen & Wardrobe</li>
              <li>• False Ceiling & Lighting</li>
              <li>• Civil & Painting</li>
              <li>• Furniture & Decor</li>
            </ul>
            <Link to="/services" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-foreground transition hover:opacity-90">
              View Services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 text-center">
        <h2 className="font-display text-4xl md:text-5xl">Ready to design your dream home?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Book a free, no-obligation consultation with our designers and get a detailed estimate within 48 hours.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="tel:9026271638" className="rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">Call 90262 71638</a>
          <Link to="/contact" className="rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold hover:bg-accent">Book Online</Link>
        </div>
      </section>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/9026271638"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Chat on WhatsApp</span>
      </a>
    </PageShell>
  );
}
