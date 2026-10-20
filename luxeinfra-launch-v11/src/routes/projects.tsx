import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { PlanLink } from "@/components/StudioLayout";
import { business, stages } from "@/lib/business";
import homeImage from "@/assets/full-home.jpg";
export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Spaces with a story. — LuxeInfra" }, { name: "robots", content: "noindex, follow" }] }),
  component: Page,
});
function Page() {
  return (
    <PageShell>
      <section className="wrap section">
        <div className="page-intro">
          <span className="eyebrow">LUXEINFRA / PROJECTS</span>
          <h1>Spaces with a story.</h1>
        </div>
        <div className="story-split">
          <img
            className="editorial-image"
            src={homeImage}
            alt="Illustrative living and dining interior"
          />
          <div>
            <span className="eyebrow">PROJECT JOURNAL</span>
            <h2>The details deserve a closer look.</h2>
            <p>
              We are preparing our project stories with photographs, the original brief, and the
              design decisions behind each home.
            </p>
            <p>
              Until these are ready, explore the inspiration collection and save the ideas you would
              like to discuss. Images in this collection are design references, not verified completed
              LuxeInfra projects.
            </p>
            <Link to="/design-ideas" className="button">
              Explore inspiration ↗
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
