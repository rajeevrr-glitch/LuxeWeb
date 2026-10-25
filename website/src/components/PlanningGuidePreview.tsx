import { Link } from "@tanstack/react-router";
import { planningGuideSummaries } from "@/lib/planning-guides";

export function PlanningGuidePreview() {
  return (
    <section className="planning-guide-preview" aria-labelledby="planning-guides-title">
      <div className="wrap">
        <div className="planning-guide-preview-intro">
          <span className="eyebrow">Before you start</span>
          <h2 id="planning-guides-title">A little preparation. Better decisions.</h2>
          <p>What to bring to the first conversation, and what to check in a quotation.</p>
          <Link to="/guides" className="text-link">
            Browse the planning guides
          </Link>
        </div>
        <div className="planning-guide-preview-links">
          {planningGuideSummaries.slice(0, 2).map((guide) => (
            <Link to="/guides/$guide" params={{ guide: guide.slug }} key={guide.slug}>
              <img src={guide.image} alt="" width="160" height="120" loading="lazy" />
              <div>
                <span>{guide.category}</span>
                <h3>{guide.title}</h3>
                <small>Read the guide</small>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
