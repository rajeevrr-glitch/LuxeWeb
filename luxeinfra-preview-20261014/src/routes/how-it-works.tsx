import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { PlanLink } from "@/components/StudioLayout";
import { business, stages } from "@/lib/business";
import homeImage from "@/assets/full-home.jpg";
export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "From a first thought to feeling at home. — LuxeInfra" }] }),
  component: Page,
});
function Page() {
  return (
    <PageShell>
      <section className="wrap section">
        <div className="page-intro">
          <span className="eyebrow">LUXEINFRA / HOW IT WORKS</span>
          <h1>From a first thought to feeling at home.</h1>
        </div>
        <div className="process-list">
          {stages.map(([title, desc], i) => (
            <article key={title}>
              <span className="process-number">0{i + 1}</span>
              <div>
                <h2>{title}</h2>
                <p>{desc}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="info-card">
          <h3>Clarity before commitment.</h3>
          <p>
            Your quotation and schedule follow a review of your requirements, measurements,
            finishes, and site conditions. Any warranty or service terms should be stated in your
            project agreement.
          </p>
          <PlanLink />
        </div>
      </section>
    </PageShell>
  );
}
