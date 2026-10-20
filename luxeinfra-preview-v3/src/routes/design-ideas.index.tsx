import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Search, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { InspirationLink } from "@/components/InspirationLink";
import { spaces, designsFor } from "@/lib/spaces";
export const Route = createFileRoute("/design-ideas/")({
  head: () => ({ meta: [{ title: "Spaces & inspiration — LuxeInfra" }] }),
  component: Spaces,
});
function Spaces() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All spaces");
  const results = spaces.filter(
    (s) =>
      (group === "All spaces" || s.group === group) &&
      `${s.title} ${s.line} ${s.consider.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <PageShell>
      <section className="wrap collection-intro">
        <div>
          <span className="eyebrow">THE INSPIRATION EDIT</span>
          <h1>
            Find a little
            <br />
            <em>of yourself.</em>
          </h1>
        </div>
        <div>
          <p>
            A room, a detail, a feeling. Explore what catches your eye and collect the ideas you’d
            like to bring home.
          </p>
          <InspirationLink />
        </div>
      </section>
      <section className="wrap collection-section">
        <div className="collection-toolbar">
          <div className="filter-pills" role="group" aria-label="Filter spaces">
            {[
              "All spaces",
              "Everyday living",
              "Personal spaces",
              "Purposeful corners",
              "Whole home",
            ].map((g) => (
              <button key={g} aria-pressed={g === group} onClick={() => setGroup(g)}>
                {g}
              </button>
            ))}
          </div>
          <label className="gallery-search">
            <Search size={18} />
            <span className="sr-only">Search spaces</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a room or need"
            />
          </label>
        </div>
        <div className="collection-count">
          <p aria-live="polite">
            {results.length} {results.length === 1 ? "space" : "spaces"} to explore
          </p>
          <span>INSPIRATION, NOT A CATALOGUE OF COMPLETED PROJECTS</span>
        </div>
        {results.length ? (
          <div className="editorial-grid">
            {results.map((s, i) => (
              <Link
                key={s.slug}
                to="/design-ideas/$category"
                params={{ category: s.slug }}
                className="editorial-card"
              >
                <div className="editorial-card-image">
                  <img
                    src={s.image}
                    alt={`${s.title} design inspiration`}
                    loading={i < 2 ? "eager" : "lazy"}
                  />
                  <span className="image-index">
                    {String(spaces.indexOf(s) + 1).padStart(2, "0")}
                  </span>
                  <span className="image-action">
                    <ArrowUpRight size={22} />
                  </span>
                </div>
                <div className="editorial-card-title">
                  <h2>{s.title}</h2>
                  <span>{designsFor(s.slug).length} ideas</span>
                </div>
                <p>{s.line}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-collection">
            <h2>No rooms found. Plenty of possibilities.</h2>
            <p>Try “kitchen”, “storage”, or explore all spaces.</p>
            <button
              className="button"
              onClick={() => {
                setQuery("");
                setGroup("All spaces");
              }}
            >
              Show all spaces
            </button>
          </div>
        )}
      </section>
      <section className="wrap discovery-banner">
        <div>
          <span className="eyebrow">NOT SURE WHAT TO CALL YOUR STYLE?</span>
          <h2>
            Start with how it <em>feels.</em>
          </h2>
          <p>Three small choices. A starting point for your design conversation.</p>
        </div>
        <Link to="/find-your-style" className="button">
          Find my direction <ArrowRight size={17} />
        </Link>
      </section>
    </PageShell>
  );
}
