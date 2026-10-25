import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, MessageSquareText } from "lucide-react";
import { clientReferences } from "@/lib/owner-content";
import { businessProof } from "@/lib/business-proof";
import "@/named-stories.css";

export function NamedClientStories({ page = false }: { page?: boolean }) {
  const [city, setCity] = useState("All locations");
  const cities = [...new Set(clientReferences.map((client) => client.city.split(", ").at(-1)!))];
  const shown = clientReferences.filter(
    (client) => city === "All locations" || client.city.endsWith(city),
  );
  return (
    <section
      className="wrap named-stories"
      id="client-stories"
      aria-labelledby="named-stories-title"
    >
      <div className="named-stories-heading">
        <div className="named-stories-intro">
          <span className="lc-kicker">LUXEINFRA / CLIENT STORIES</span>
          {page ? (
            <h1 id="named-stories-title">Every home has its people.</h1>
          ) : (
            <h2 id="named-stories-title">Every home has its people.</h2>
          )}
          <p>
            At LuxeInfra, we bring layouts, materials and thoughtful details together around the way
            you live. Meet a few of the people behind our work, and explore the spaces we’ve shaped.
          </p>
          <div className="named-stories-intro-links">
            <Link to={page ? "/projects" : "/testimonials"} className="button secondary">
              {page ? "Explore our work" : "Client stories"}
            </Link>
            <Link to="/callback" className="lc-text-action">
              Discuss your space
            </Link>
          </div>
        </div>
        <aside className="named-stories-proof" aria-label="LuxeInfra at a glance">
          <span className="lc-kicker">THE STUDIO, AT A GLANCE</span>
          <dl>
            <div>
              <dt>{businessProof.experienceYears}+</dt>
              <dd>years of experience</dd>
            </div>
            <div>
              <dt>{businessProof.deliveredProjects}+</dt>
              <dd>projects delivered</dd>
            </div>
          </dl>
          <p>
            Homes and commercial spaces, considered from the first idea to the finishing details.
          </p>
        </aside>
      </div>
      {page && (
        <div
          className="named-stories-filters"
          role="group"
          aria-label="Filter client stories by city"
        >
          {["All locations", ...cities].map((item) => (
            <button key={item} aria-pressed={city === item} onClick={() => setCity(item)}>
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="named-stories-grid" aria-live={page ? "polite" : undefined}>
        {shown.map((client) => (
          <article key={client.id} id={client.id}>
            <div className="named-stories-card-copy">
              <div className="named-stories-byline">
                <span className="named-stories-initial" aria-hidden="true">
                  {client.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <h3>{client.name}</h3>
                  <p className="named-stories-location">
                    <MapPin size={14} aria-hidden="true" />
                    {client.city}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="named-stories-footer">
        <span>
          <MessageSquareText size={21} aria-hidden="true" />
          Your space could be our next story.
        </span>
        <Link to="/callback" className="button">
          Discuss my project
        </Link>
      </div>
    </section>
  );
}
