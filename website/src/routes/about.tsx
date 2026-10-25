import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { PlanLink } from "@/components/StudioLayout";
import homeImage from "@/assets/full-home.jpg";
export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "Interiors begin with you. — LuxeInfra" }] }),
  component: Page,
});
function Page() {
  return (
    <PageShell>
      <section className="wrap section">
        <div className="page-intro">
          <span className="eyebrow">LUXEINFRA / ABOUT</span>
          <h1>Interiors begin with you.</h1>
        </div>
        <div className="story-split">
          <img
            className="editorial-image"
            src={homeImage}
            alt="Interior design inspiration in natural tones"
          />
          <div>
            <span className="eyebrow">THE LUXEINFRA APPROACH</span>
            <h2>Good design makes room for real life.</h2>
            <p>
              We begin with the way you want to live. The routines, the people, the things you want
              to keep close — and the space you want to make your own.
            </p>
            <p>
              From a focused room update to a complete home, your brief helps us bring the layout,
              materials, storage, and finishing details into one conversation.
            </p>
            <p>Serving Uttar Pradesh, Delhi NCR, and Bengaluru.</p>
            <PlanLink />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
