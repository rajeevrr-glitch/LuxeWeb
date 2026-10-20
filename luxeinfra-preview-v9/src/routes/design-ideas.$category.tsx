import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ArrowUpRight, ArrowLeft, Plus } from "lucide-react";
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
  const { space, designs } = Route.useLoaderData();
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : designs[selected];
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
            to="/plan"
            search={{
              room: space.room || undefined,
              scope: space.room ? "Selected rooms" : "Whole home",
            }}
            className="button"
          >
            Plan {space.slug === "full-home" ? "my home" : "this space"} <ArrowUpRight size={18} />
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
            <article key={d.id} className="design-card">
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
          className="design-lightbox"
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
              <img src={active.image} alt={active.title} />
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
