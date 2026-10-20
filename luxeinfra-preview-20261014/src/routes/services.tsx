import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { PlanLink } from "@/components/StudioLayout";
import { business, stages } from "@/lib/business";
import homeImage from "@/assets/full-home.jpg";
export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "A whole home. Or your next chapter. — LuxeInfra" }] }),
  component: Page,
});
function Page() {
  return (
    <PageShell>
      <section className="wrap section">
        <div className="page-intro">
          <span className="eyebrow">LUXEINFRA / SERVICES</span>
          <h1>A whole home. Or your next chapter.</h1>
        </div>
        <p className="intro-text">
          Choose the spaces and work that matter to you. We’ll review the requirements together
          before confirming the scope.
        </p>
        <div className="entry-grid">
          {[
            [
              "Whole-home interiors",
              "A connected design direction across your rooms, layouts, finishes, and storage.",
            ],
            [
              "Kitchens & wardrobes",
              "Plan your everyday essentials around useful storage, thoughtful fittings, and your preferred finish.",
            ],
            [
              "Room upgrades & renovation",
              "Tell us about lighting, ceilings, paint, flooring, electrical, plumbing, or furniture requirements.",
            ],
          ].map(([title, desc]) => (
            <article className="info-card" key={title}>
              <h3>{title}</h3>
              <p>{desc}</p>
              <PlanLink scope="Selected rooms">Choose your work</PlanLink>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
