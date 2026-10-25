import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { PortfolioGallery } from "@/components/PortfolioGallery";
export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Our work, up close — LuxeInfra" },
      {
        name: "description",
        content:
          "Explore photographs and short films from the LuxeInfra portfolio: bedrooms, kitchens and living spaces.",
      },
    ],
  }),
  component: Page,
});
function Page() {
  return (
    <PageShell>
      <section className="wrap lx-page-intro">
        <span className="eyebrow">LUXEINFRA / OUR WORK</span>
        <h1>
          The spaces.
          <br />
          <em>The little details.</em>
        </h1>
        <p>
          A look inside our work, through the studio’s own photographs and films. Open any image to
          take a closer look.
        </p>
      </section>
      <PortfolioGallery />
    </PageShell>
  );
}
