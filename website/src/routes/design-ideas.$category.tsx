import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ArrowLeft, Plus, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SaveInspiration } from "@/components/SaveInspiration";
import { InspirationLink } from "@/components/InspirationLink";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { spaces, designsFor } from "@/lib/spaces";
export const Route = createFileRoute("/design-ideas/$category")({
  loader: ({ params }) => {
    const space = spaces.find((s) => s.slug === params.category);
    if (!space) throw notFound();
    return { space, designs: designsFor(space.slug) };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.space.title || "Room"} inspiration — LuxeInfra` }],
  }),
  component: Room,
});
function Room() {
  const {
    space,
    designs,
  }: { space: (typeof spaces)[number]; designs: ReturnType<typeof designsFor> } =
    Route.useLoaderData();
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : designs[selected];
  const related = active
    ? designs
        .map((design, index) => ({ ...design, index }))
        .filter((design) => design.id !== active.id)
        .slice(0, 3)
    : [];
  const opener = useRef<HTMLButtonElement | null>(null);
  return (
    <PageShell>
      <section className="wrap room-intro">
        <div>
          <Link to="/design-ideas" className="text-link">
            <ArrowLeft size={15} /> All spaces
          </Link>
          <span className="eyebrow">THE ROOM EDIT / {space.title.toUpperCase()}</span>
          <h1>{space.line}</h1>
          <p>{space.intro}</p>
          <Link
            to="/callback"
            search={{
              room: space.room || undefined,
              scope: space.room ? "Selected rooms" : "Whole home",
              module:
                space.slug === "kitchen"
                  ? "Kitchen"
                  : space.slug === "wardrobe"
                    ? "Wardrobes"
                    : undefined,
            }}
            className="button"
          >
            <MessageCircle size={18} /> Get a quote
          </Link>
        </div>
        <div className="room-cover">
          <img src={space.image} alt={`${space.title} inspiration`} />
          <span>DESIGN REFERENCE / {space.title.toUpperCase()}</span>
        </div>
      </section>
      <section className="room-consider">
        <div className="wrap">
          <span className="eyebrow">BEFORE THE FINISHES, THE EVERYDAY.</span>
          <h2>A few things to think about.</h2>
          <div>
            {space.consider.map((c, i) => (
              <p key={c}>
                <span>0{i + 1}</span>
                {c}
              </p>
            ))}
          </div>
        </div>
      </section>
      <section className="wrap section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">COLLECT WHAT SPEAKS TO YOU</span>
            <h2>The {space.title.toLowerCase()} edit.</h2>
            <p className="fine-print">
              {designs.length} inspiration references. Save up to 12 ideas across rooms.
            </p>
          </div>
          <InspirationLink />
        </div>
        <div className="design-grid">
          {designs.map((d, i) => (
            <article key={d.id} id={d.id} className="design-card">
              <button
                className="design-image-button"
                aria-label={`Enlarge ${d.title}`}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setSelected(i);
                }}
              >
                <img src={d.image} alt={d.title} loading="lazy" />
                <span>
                  <Plus size={20} />
                </span>
              </button>
              <div className="design-card-caption">
                <h3>{d.title}</h3>
                <SaveInspiration item={d} />
              </div>
            </article>
          ))}
        </div>
      </section>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          className="luxe-commerce design-lightbox"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          {active && (
            <>
              <DialogTitle>{active.title}</DialogTitle>
              <DialogDescription>
                Inspiration reference. Save this idea to discuss it with your designer.
              </DialogDescription>
              <div className="design-detail-grid">
                <img src={active.image} alt={active.title} />
                <aside className="design-detail-notes">
                  <span className="eyebrow">
                    REFERENCE {String((selected ?? 0) + 1).padStart(2, "0")} OF {designs.length}
                  </span>
                  <h3>Make this idea your own.</h3>
                  <p>Use this reference to discuss what matters in your space:</p>
                  <ul>
                    {space.consider.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Link
                    to="/callback"
                    search={{
                      scope: space.room ? "Selected rooms" : "Whole home",
                      room: space.room || undefined,
                      module:
                        space.slug === "kitchen"
                          ? "Kitchen"
                          : space.slug === "wardrobe"
                            ? "Wardrobes"
                            : undefined,
                      design: active.id,
                    }}
                    className="button"
                  >
                    <MessageCircle size={17} /> Get a quote for this idea
                  </Link>
                  <small>
                    Visual inspiration, not a completed LuxeInfra project. Dimensions,
                    specifications and price are confirmed for your space.
                  </small>
                  <Link to="/my-inspiration" className="text-link">
                    Compare your saved ideas
                  </Link>
                </aside>
              </div>
              {related.length > 0 && (
                <div className="design-related" aria-labelledby="related-ideas-title">
                  <div className="design-related-heading">
                    <h3 id="related-ideas-title">More from this room edit</h3>
                    <span>Explore another direction</span>
                  </div>
                  <div className="design-related-grid">
                    {related.map((idea) => (
                      <button
                        type="button"
                        key={idea.id}
                        onClick={() => setSelected(idea.index)}
                        aria-label={`View ${idea.title}`}
                      >
                        <img src={idea.image} alt="" width={240} height={180} loading="lazy" />
                        <span>{idea.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="lightbox-actions">
                <button
                  className="text-link"
                  disabled={selected === 0}
                  onClick={() => setSelected((selected ?? 0) - 1)}
                >
                  ← Previous
                </button>
                <SaveInspiration item={active} />
                <button
                  className="text-link"
                  disabled={selected === designs.length - 1}
                  onClick={() => setSelected((selected ?? 0) + 1)}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
