import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Calculator, Phone, Check, FileText } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { QuoteButtonContent } from "@/components/QuoteButtonContent";
import { rooms } from "@/lib/business";
import kitchen from "@/assets/kitchen.jpg";
import living from "@/assets/living.jpg";
import { planningJourney } from "@/lib/journey";

export const Route = createFileRoute("/plan")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { scope?: string; room?: string; style?: string; roomBrief?: string } => ({
    scope: typeof search.scope === "string" ? search.scope.slice(0, 80) : undefined,
    room: typeof search.room === "string" && rooms.includes(search.room) ? search.room : undefined,
    style: typeof search.style === "string" ? search.style.slice(0, 80) : undefined,
    roomBrief: search.roomBrief === "1" ? "1" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your next step — LuxeInfra" },
      {
        name: "description",
        content: "Plan your interiors or request a quote. Choose the way you want to begin.",
      },
    ],
  }),
  component: Begin,
});
function Begin() {
  const search = Route.useSearch();
  if (search.roomBrief === "1") return <Navigate to="/project-brief" search={search} replace />;
  return (
    <PageShell>
      <section className="wrap lx-page-intro lx-centered">
        <span className="eyebrow">MAKE YOURSELF AT HOME</span>
        <h1>Your home. Your next step.</h1>
        <p>
          Plan your interiors or get a quote. Choose what feels right for you — no long brief
          required.
        </p>
      </section>
      <section className="wrap lx-journey-grid">
        <article>
          <img src={kitchen} alt="Kitchen inspiration" />
          <div>
            <span className="lx-icon">
              <Calculator size={24} />
            </span>
            <span className="eyebrow">I’M EXPLORING POSSIBILITIES</span>
            <h2>{planningJourney().label}.</h2>
            <p>
              Start with your BHK and size, then choose Essential, Signature or Luxe. Your
              renovation work area gives you a starting budget; the final quote follows a site
              visit.
            </p>
            <ul>
              <li>
                <Check size={15} /> Full-home renovation from ₹1,100/sq ft
              </li>
              <li>
                <Check size={15} /> Simple size choices — no floor plan needed
              </li>
            </ul>
            <Link
              to="/estimate"
              search={{ scope: search.scope, room: search.room, style: search.style }}
              className="button"
            >
              {planningJourney().label}
            </Link>
          </div>
        </article>
        <article>
          <img src={living} alt="Living room inspiration" />
          <div>
            <span className="lx-icon">
              <Phone size={24} />
            </span>
            <span className="eyebrow">I’D LIKE SOME GUIDANCE</span>
            <h2>Get a quote.</h2>
            <p>
              Your name, number, city and what you’re considering. Send a short request and we can
              take it from there.
            </p>
            <ul>
              <li>
                <Check size={15} /> No measurements needed
              </li>
              <li>
                <Check size={15} /> Send a short request to our team
              </li>
            </ul>
            <Link
              to="/callback"
              search={{ scope: search.scope, room: search.room, style: search.style }}
              className="button quote-action"
            >
              <QuoteButtonContent />
            </Link>
          </div>
        </article>
      </section>
      <div className="wrap lx-advanced-note">
        <FileText size={20} />
        <div>
          <strong>Already have a detailed vision?</strong>
          <p>The optional project brief brings your room-by-room ideas together.</p>
        </div>
        <Link to="/project-brief" search={search} className="lx-underlink">
          Open detailed brief
        </Link>
      </div>
    </PageShell>
  );
}
