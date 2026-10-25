import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Quote } from "lucide-react";
import { publishedProjects, clientReviews, clientReferences } from "@/lib/owner-content";
import { NamedClientStories } from "./NamedClientStories";
import { selectReviewContent } from "@/lib/review-content";
import { business } from "@/lib/business";
import { QuoteButtonContent } from "@/components/QuoteButtonContent";
import "@/client-stories.css";

export function ClientStories({
  kind = "all",
  page = false,
}: {
  kind?: "all" | "projects" | "reviews";
  page?: boolean;
}) {
  const [city, setCity] = useState("All locations");
  const projects = kind === "reviews" ? [] : publishedProjects;
  const reviews = selectReviewContent(clientReviews);
  const cityFor = (location?: string) => location?.split(",").at(-1)?.trim() || "Other locations";
  const cities = [...new Set(reviews.cards.map((review) => cityFor(review.location)))];
  const shownReviews = page
    ? reviews.cards.filter(
        (review) => city === "All locations" || cityFor(review.location) === city,
      )
    : reviews.cards.slice(0, 3);
  if (kind === "projects" && !projects.length) return null;
  if (kind !== "projects" && clientReferences.length && reviews.mode !== "approved")
    return <NamedClientStories page={page} />;
  return (
    <>
      {!!projects.length && (
        <section className="wrap lc-section lx-client-stories">
          <span className="lc-kicker">Our projects</span>
          <h2>Homes we’ve worked on.</h2>
          <div className="lx-scope-grid">
            {projects.map((project) => (
              <article key={project.id}>
                <img src={project.image} alt={project.imageAlt} loading="lazy" />
                <span className="eyebrow">
                  {project.city} · {project.scope}
                </span>
                <h3>{project.title}</h3>
                <p>{project.story}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {kind !== "projects" && (
        <section
          className={`lc-stories${page ? " lc-stories-page" : ""}`}
          id="client-stories"
          aria-labelledby="stories-title"
        >
          <div className="wrap lc-section">
            <div className="lc-stories-heading">
              <div className="lc-stories-intro">
                <span className="lc-kicker">
                  <MessageCircle size={17} /> Client reviews
                </span>
                {page ? (
                  <h1 id="stories-title">Hear from our clients.</h1>
                ) : (
                  <h2 id="stories-title">Hear from our clients.</h2>
                )}
                <p>Feedback about the design, the work and living with the finished interiors.</p>
                {reviews.mode === "empty" && (
                  <p className="lc-stories-empty-note">
                    Client reviews are being added. You can still browse design ideas or speak with
                    us about your project.
                  </p>
                )}
                {!page && (
                  <Link to="/testimonials" className="button secondary">
                    View client reviews
                  </Link>
                )}
              </div>
            </div>
            {page && cities.length > 1 && (
              <div className="lx-review-locations" role="group" aria-label="Filter reviews by city">
                {["All locations", ...cities].map((location) => (
                  <button
                    key={location}
                    onClick={() => setCity(location)}
                    aria-pressed={city === location}
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
            {reviews.cards.length > 0 ? (
              <div className="lc-story-cards" aria-live={page ? "polite" : undefined}>
                {shownReviews.map((review) => (
                  <figure key={review.id} id={review.id}>
                    <div className="lc-story-top">
                      <span>{review.scope}</span>
                      <Quote size={25} strokeWidth={1.4} aria-hidden="true" />
                    </div>
                    <h3>{review.title}</h3>
                    <blockquote>“{review.quote}”</blockquote>
                    <figcaption>
                      <span className="lc-story-monogram" aria-hidden="true">
                        {review.byline.slice(0, 1)}
                      </span>
                      <span>
                        <strong>{review.byline}</strong>
                        <small>{review.location || review.scope}</small>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="lc-story-invitation">
                <div>
                  <MessageCircle size={23} />
                  <h3>Worked with LuxeInfra?</h3>
                  <p>Tell us what went well and where we could improve.</p>
                </div>
                <a
                  href={`mailto:${business.email}?subject=${encodeURIComponent("My LuxeInfra experience")}`}
                  className="button"
                >
                  Share your experience
                </a>
              </div>
            )}
            {!page && reviews.cards.length > shownReviews.length && (
              <div className="lx-review-more">
                <Link to="/testimonials" className="button secondary">
                  Read more client stories
                </Link>
              </div>
            )}
            {page && (
              <div className="lc-stories-next">
                <span>Have a project in mind? Tell us what you need.</span>
                <Link to="/callback" className="button quote-action">
                  <QuoteButtonContent />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
