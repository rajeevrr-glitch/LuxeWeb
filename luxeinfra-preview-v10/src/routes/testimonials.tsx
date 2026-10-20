import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Quote } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { sampleTestimonials } from "@/lib/testimonials";
import home from "@/assets/full-home.jpg";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [{ title: "Testimonials — LuxeInfra" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Testimonials,
});

function Testimonials() {
  const featured = sampleTestimonials[0];
  return (
    <PageShell>
      <section className="testimonials-opening wrap">
        <div>
          <span className="eyebrow">LUXEINFRA / TESTIMONIALS</span>
          <h1>
            Every home has
            <br />
            <em>a personal story.</em>
          </h1>
        </div>
        <p>
          The everyday moments. The details that matter. A place for our clients to share what home
          means to them.
        </p>
      </section>
      <div className="testimonials-notice wrap">
        <strong>Preview collection</strong>
        <p>
          The reviews below are illustrative sample copy, not real client testimonials. Approved
          client stories will replace them.
        </p>
      </div>
      <section className="featured-testimonial wrap" aria-labelledby="featured-review-title">
        <figure>
          <img
            src={home}
            alt="Interior design inspiration, not a project associated with this sample review"
            width="1024"
            height="768"
            fetchPriority="high"
          />
          <figcaption>INTERIOR INSPIRATION · NOT A REVIEWED PROJECT</figcaption>
        </figure>
        <div className="featured-testimonial-copy">
          <span className="sample-review-label">SAMPLE COPY · NOT A REAL CLIENT REVIEW</span>
          <Quote size={32} strokeWidth={1} aria-hidden="true" />
          <h2 id="featured-review-title">{featured.title}</h2>
          <blockquote>“{featured.quote}”</blockquote>
          <div className="review-attribution">
            <span aria-hidden="true">01</span>
            <div>
              <strong>Client name to be added</strong>
              <p>{featured.category} · Example only</p>
            </div>
          </div>
        </div>
      </section>
      <section className="review-collection wrap" aria-label="More example testimonials">
        {sampleTestimonials.slice(1).map((review, index) => (
          <article className="review-story" key={review.id}>
            <div className="review-story-top">
              <span className="sample-review-label">SAMPLE COPY · EXAMPLE ONLY</span>
              <Quote size={27} strokeWidth={1} aria-hidden="true" />
            </div>
            <h2>{review.title}</h2>
            <blockquote>“{review.quote}”</blockquote>
            <div className="review-attribution">
              <span aria-hidden="true">0{index + 2}</span>
              <div>
                <strong>Client name to be added</strong>
                <p>{review.category} · Not a real review</p>
              </div>
            </div>
          </article>
        ))}
      </section>
      <section className="review-closing wrap">
        <span className="eyebrow">THE SPACES BEHIND THE STORIES</span>
        <h2>
          Find what feels <em>like you.</em>
        </h2>
        <Link to="/design-ideas" className="text-link">
          Explore interior inspiration <ArrowUpRight size={18} />
        </Link>
      </section>
    </PageShell>
  );
}
