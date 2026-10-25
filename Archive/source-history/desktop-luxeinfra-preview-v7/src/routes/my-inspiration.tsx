import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, ArrowUpRight, Trash2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { readInspiration, saveInspiration, type Inspiration } from "@/lib/inspiration";
export const Route = createFileRoute("/my-inspiration")({
  head: () => ({ meta: [{ title: "My inspiration — LuxeInfra" }] }),
  component: Shortlist,
});
function Shortlist() {
  const [ideas, setIdeas] = useState<Inspiration[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const update = () => setIdeas(readInspiration());
    update();
    window.addEventListener("luxe-shortlist", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("luxe-shortlist", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return (
    <PageShell>
      <section className="wrap section">
        <div className="shortlist-heading">
          <div>
            <span className="eyebrow">YOUR OWN LITTLE COLLECTION</span>
            <h1>
              Ideas worth <em>keeping.</em>
            </h1>
            <p>
              A room you love. A detail you’d like to explore. Your saved ideas become part of your
              project brief.
            </p>
          </div>
          <span className="shortlist-total">
            <Heart size={22} />
            {ideas.length}
            <small>OF 12 IDEAS</small>
          </span>
        </div>
        {error && <p role="alert">{error}</p>}
        {ideas.length ? (
          <>
            <div className="shortlist-actions">
              <Link to="/design-ideas" className="text-link">
                Keep exploring ↗
              </Link>
              <Link to="/plan" className="button">
                Plan with these ideas <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="design-grid">
              {ideas.map((item) => (
                <article className="design-card" key={item.id}>
                  <img className="shortlist-image" src={item.image} alt={item.title} />
                  <div className="design-card-caption">
                    <h2>{item.title}</h2>
                    <button
                      className="text-link"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => {
                        try {
                          saveInspiration(item);
                        } catch {
                          setError(
                            "This browser could not update your saved ideas. Please try again.",
                          );
                        }
                      }}
                    >
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-collection">
            <Heart size={34} />
            <h2>Your inspiration starts with one idea.</h2>
            <p>Browse a room and tap “Use this as inspiration” on any design you like.</p>
            <Link to="/design-ideas" className="button">
              Explore the collection <ArrowUpRight size={18} />
            </Link>
          </div>
        )}
        <p className="fine-print">
          Saved in this browser only. Your most recent 12 ideas are kept. Inspiration images are
          references, not confirmed specifications or completed project claims.
        </p>
      </section>
    </PageShell>
  );
}
