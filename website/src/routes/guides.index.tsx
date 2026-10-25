import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { planningGuides } from "@/lib/planning-guides";
import { planningJourney } from "@/lib/journey";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Interior planning guides — LuxeInfra" },
      {
        name: "description",
        content:
          "Useful interior planning guides: prepare for a design call, compare quotations, plan a kitchen and prioritise a renovation.",
      },
    ],
  }),
  component: Guides,
});

function Guides() {
  const featured = planningGuides[0];
  return (
    <PageShell>
      <section className="wrap lg-collection-intro">
        <div>
          <span className="eyebrow">THE PRACTICAL EDIT</span>
          <h1>
            Good rooms begin
            <br />
            with <em>good questions.</em>
          </h1>
        </div>
        <p>Prepare for a design call, compare quotes and plan the rooms you use every day.</p>
      </section>
      <section className="wrap lg-featured" aria-labelledby="lg-featured-title">
        <div className="lg-featured-photo">
          <img
            src={featured.image}
            alt={featured.imageAlt}
            width="1280"
            height="853"
            fetchPriority="high"
          />
          <span>START HERE</span>
        </div>
        <div className="lg-featured-copy">
          <BookOpen size={25} aria-hidden="true" />
          <span className="eyebrow">{featured.category}</span>
          <h2 id="lg-featured-title">{featured.title}</h2>
          <p>{featured.description}</p>
          <Link to="/guides/$guide" params={{ guide: featured.slug }} className="button">
            Read the guide
          </Link>
          <span className="lg-small-note">No sign-up. Just a useful place to start.</span>
        </div>
      </section>
      <section className="wrap lg-library" aria-labelledby="lg-library-title">
        <div className="lg-section-heading">
          <div>
            <span className="eyebrow">A LITTLE MORE CONFIDENCE</span>
            <h2 id="lg-library-title">For the decisions ahead.</h2>
          </div>
          <p>
            Keep the questions that matter to you. Each guide includes a short checklist to take
            into your conversation.
          </p>
        </div>
        <div className="lg-guide-grid">
          {planningGuides.slice(1).map((guide) => (
            <article key={guide.slug} className="lg-guide-card">
              <Link
                to="/guides/$guide"
                params={{ guide: guide.slug }}
                aria-label={`Read ${guide.title}`}
                className="lg-card-image"
                tabIndex={-1}
                aria-hidden="true"
              >
                <img src={guide.image} alt="" loading="lazy" width="800" height="600" />
              </Link>
              <div>
                <span className="eyebrow">{guide.category}</span>
                <h3>
                  <Link to="/guides/$guide" params={{ guide: guide.slug }}>
                    {guide.title}
                  </Link>
                </h3>
                <p>{guide.description}</p>
                <Link to="/guides/$guide" params={{ guide: guide.slug }} className="lg-read-link">
                  Read guide<span className="sr-only">: {guide.title}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="wrap lg-next-step">
        <ClipboardCheck size={30} aria-hidden="true" />
        <div>
          <span className="eyebrow">FROM READING TO YOUR OWN ROOMS</span>
          <h2>Put your priorities in place.</h2>
          <p>
            Choose your rooms and the work you have in mind. You can explore the planner without
            sharing contact details.
          </p>
        </div>
        <Link to="/estimate" className="button">
          {planningJourney().label}
        </Link>
      </section>
    </PageShell>
  );
}
