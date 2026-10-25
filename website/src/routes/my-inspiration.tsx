import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Heart,
  ArrowUpRight,
  Trash2,
  Check,
  Columns2,
  Download,
  MessageCircle,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { readInspiration, saveInspiration, type Inspiration } from "@/lib/inspiration";
import {
  comparisonFocus,
  readDesignComparison,
  saveDesignComparison,
  sanitiseDesignComparison,
  describeDesignComparison,
  type DesignComparison,
  type ComparisonFocus,
} from "@/lib/design-comparison";
export const Route = createFileRoute("/my-inspiration")({
  head: () => ({ meta: [{ title: "My inspiration — LuxeInfra" }] }),
  component: Shortlist,
});
function Shortlist() {
  const [ideas, setIdeas] = useState<Inspiration[]>([]);
  const [comparison, setComparison] = useState<DesignComparison>({ ids: [], preferences: {} });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [comparisonNotice, setComparisonNotice] = useState("");
  useEffect(() => {
    const update = () => {
      const saved = readInspiration();
      const stored = readDesignComparison(
        saved.map((idea) => idea.id),
        saved.slice(0, 3).map((idea) => idea.id),
      );
      setIdeas(saved);
      setComparison(stored);
    };
    update();
    window.addEventListener("luxe-shortlist", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("luxe-shortlist", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  function changeComparison(next: DesignComparison) {
    const validIds = ideas.map((idea) => idea.id);
    setComparison(sanitiseDesignComparison(next, validIds));
    try {
      saveDesignComparison(next, validIds);
      setError("");
    } catch {
      setError(
        "Your comparison is available here, but this browser could not save its choices. Download your direction sheet to keep it.",
      );
    }
  }
  function toggleIdea(id: string) {
    if (comparison.ids.includes(id)) {
      changeComparison({ ...comparison, ids: comparison.ids.filter((item) => item !== id) });
      setComparisonNotice("Idea removed from comparison. It is still saved in your collection.");
    } else if (comparison.ids.length < 3) {
      changeComparison({ ...comparison, ids: [...comparison.ids, id] });
      setComparisonNotice("Idea added to comparison below.");
    } else {
      setComparisonNotice(
        "Compare up to three at a time. Remove one from the comparison to add another.",
      );
    }
  }
  function toggleFocus(id: string, focus: ComparisonFocus) {
    const current = comparison.preferences[id] || [];
    changeComparison({
      ...comparison,
      preferences: {
        ...comparison.preferences,
        [id]: current.includes(focus)
          ? current.filter((item) => item !== focus)
          : [...current, focus],
      },
    });
  }
  function downloadDirection() {
    const content = [
      "MY DESIGN DIRECTION — LUXEINFRA",
      "Visual inspiration for discussion; not a specification, price or completed project claim.",
      describeDesignComparison(comparison, ideas, notes),
      "To confirm with the studio: room measurements, layout feasibility, proposed materials, scope and quotation.",
    ].join("\n\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "LuxeInfra-my-design-direction.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const compared = comparison.ids.flatMap((id) => {
    const idea = ideas.find((item) => item.id === id);
    return idea ? [idea] : [];
  });
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
              Collect a few favourites, look at them together and tell us what feels right for your
              home.
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
                Keep exploring
              </Link>
              <Link to="/callback" className="button">
                <MessageCircle size={18} /> Discuss saved ideas
              </Link>
            </div>
            <div className="decision-collection-bar">
              <div>
                <Columns2 size={21} />
                <p>
                  Choose up to <strong>3 ideas</strong> to compare.
                </p>
              </div>
              <a href="#compare-ideas" className="text-link">
                View comparison ({compared.length})
              </a>
            </div>
            <p className="decision-notice" aria-live="polite">
              {comparisonNotice}
            </p>
            <div className="design-grid">
              {ideas.map((item) => (
                <article className="design-card" key={item.id}>
                  <img
                    className="shortlist-image"
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                  />
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
                  <button
                    type="button"
                    className="decision-compare-toggle"
                    aria-pressed={comparison.ids.includes(item.id)}
                    aria-label={`${comparison.ids.includes(item.id) ? "Remove" : "Add"} ${item.title} ${comparison.ids.includes(item.id) ? "from" : "to"} comparison`}
                    onClick={() => toggleIdea(item.id)}
                  >
                    {comparison.ids.includes(item.id) ? (
                      <Check size={16} />
                    ) : (
                      <Columns2 size={16} />
                    )}
                    {comparison.ids.includes(item.id) ? "In your comparison" : "Compare this idea"}
                  </button>
                </article>
              ))}
            </div>
            <section
              className="design-decisions"
              id="compare-ideas"
              aria-labelledby="comparison-title"
            >
              <div className="decision-intro">
                <div>
                  <span className="eyebrow">FROM SAVED TO SURE</span>
                  <h2 id="comparison-title">Put your favourites side by side.</h2>
                  <p>
                    It might be the colours in one and the storage in another. Pick the details you
                    like; we’ll explore how they could work together.
                  </p>
                </div>
                <span className="decision-count">
                  {compared.length}
                  <small>OF 3 IDEAS</small>
                </span>
              </div>
              {compared.length ? (
                <>
                  {compared.length === 1 && (
                    <p className="decision-single-hint">
                      Add another saved idea above to see two directions together.
                    </p>
                  )}
                  <div className={`decision-columns decision-columns-${compared.length}`}>
                    {compared.map((item, index) => (
                      <article className="decision-column" key={item.id}>
                        <div className="decision-image">
                          <img src={item.image} alt={item.title} loading="lazy" />
                          <span>{String.fromCharCode(65 + index)}</span>
                        </div>
                        <div className="decision-column-body">
                          <div className="decision-column-title">
                            <h3>{item.title}</h3>
                            <button
                              type="button"
                              className="text-link"
                              onClick={() => toggleIdea(item.id)}
                              aria-label={`Remove ${item.title} from comparison`}
                            >
                              Remove
                            </button>
                          </div>
                          <fieldset>
                            <legend>What draws you to it?</legend>
                            <div className="decision-focus-options">
                              {comparisonFocus.map((focus) => (
                                <button
                                  type="button"
                                  key={focus}
                                  aria-pressed={(comparison.preferences[item.id] || []).includes(
                                    focus,
                                  )}
                                  onClick={() => toggleFocus(item.id, focus)}
                                >
                                  {(comparison.preferences[item.id] || []).includes(focus) && (
                                    <Check size={13} />
                                  )}
                                  {focus}
                                </button>
                              ))}
                            </div>
                          </fieldset>
                          <label className="decision-note">
                            One detail to remember <span>optional</span>
                            <textarea
                              rows={3}
                              maxLength={180}
                              value={notes[item.id] || ""}
                              onChange={(event) =>
                                setNotes((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }
                              placeholder="For example, a quieter colour palette with more closed storage."
                            />
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="decision-summary">
                    <div>
                      <h3>A direction to discuss, not a fixed design.</h3>
                      <p>
                        Measurements, finishes and the final scope need a conversation. Your chosen
                        details help us understand your taste.
                      </p>
                    </div>
                    <div className="decision-summary-actions">
                      <Link to="/callback" className="button">
                        <MessageCircle size={17} /> Discuss these ideas
                      </Link>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={downloadDirection}
                      >
                        <Download size={17} /> Download my direction
                      </button>
                    </div>
                  </div>
                  <p className="decision-privacy">
                    Selected idea numbers and preference buttons are saved in this browser and can
                    be included with your saved ideas in a quote request. Written notes stay on this
                    page and are only included when you download your direction sheet; they clear
                    when you leave or reload.
                  </p>
                </>
              ) : (
                <div className="decision-empty">
                  <Columns2 size={28} />
                  <h3>Which ideas would you like to put together?</h3>
                  <p>Tap “Compare this idea” on two or three saved designs above.</p>
                </div>
              )}
            </section>
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
