import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { Camera, ChevronLeft, ChevronRight, Maximize2, Play, X } from "lucide-react";
import { portfolioHighlights, portfolioMedia, type PortfolioCategory } from "@/lib/portfolio";
import "@/portfolio.css";

const categories: ("All work" | PortfolioCategory)[] = [
  "All work",
  "Bedrooms",
  "Living spaces",
  "Kitchens",
  "Walkthroughs",
];

export function PortfolioGallery({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("All work");
  const [activeId, setActiveId] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const items = compact
    ? portfolioHighlights.flatMap((id) => portfolioMedia.filter((item) => item.id === id))
    : portfolioMedia.filter((item) => category === "All work" || item.category === category);
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const active = items[activeIndex];
  const move = (direction: number) => {
    if (items.length > 1)
      setActiveId(items[(activeIndex + direction + items.length) % items.length].id);
  };
  return (
    <section className={`wrap lp-section${compact ? " lp-compact" : ""}`} id="our-work">
      <div className="lp-heading">
        <div>
          <span className="lc-kicker">THE LUXEINFRA PORTFOLIO</span>
          <h2>{compact ? "Our work. Up close." : "Look around. Stay for the details."}</h2>
          <p>
            Bedrooms, kitchens and the corners that bring a home together. Photographs and films
            from our work, shared by the studio.
          </p>
        </div>
        {compact ? (
          <Link to="/projects" className="button secondary">
            Explore our work
          </Link>
        ) : (
          <span className="lp-count">11 photographs · 2 short films</span>
        )}
      </div>
      {!compact && (
        <div className="lp-filters" role="group" aria-label="Filter portfolio by space">
          {categories.map((item) => (
            <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      )}
      <p className="lp-sr-only" role="status">
        {items.length} portfolio {items.length === 1 ? "item" : "items"} shown
      </p>
      <div className="lp-grid">
        {items.map((item) => (
          <article className={`lp-card lp-${item.kind}`} key={item.id} id={item.id}>
            <button
              className="lp-open"
              onClick={(event) => {
                opener.current = event.currentTarget;
                setActiveId(item.id);
              }}
              aria-label={`${item.kind === "video" ? "Open film" : "View"} ${item.title}`}
            >
              {item.kind === "photo" ? (
                <img
                  src={item.thumbnail || item.src}
                  srcSet={`${item.thumbnail} 640w, ${item.src} ${item.width}w`}
                  sizes="(max-width: 600px) 45vw, (max-width: 1000px) 45vw, 30vw"
                  alt={item.description}
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="lp-film-cover" aria-hidden="true">
                  <span className="lp-film-lines" />
                  <span className="lp-play">
                    <Play fill="currentColor" size={28} />
                  </span>
                  <span>STEP INSIDE</span>
                  <strong>{item.duration}</strong>
                </span>
              )}
              <span className="lp-media-tag">
                {item.kind === "video" ? <Play size={13} /> : <Camera size={13} />}
                {item.kind === "video" ? "Project film" : item.category}
              </span>
              <span className="lp-expand" aria-hidden="true">
                {item.kind === "video" ? <Play size={18} /> : <Maximize2 size={18} />}
              </span>
            </button>
            <h3>{item.title}</h3>
            {item.location && <p className="lp-card-location">{item.location}</p>}
          </article>
        ))}
      </div>
      {compact ? (
        <p className="lp-footnote">
          A few views from the portfolio. Open the gallery for more photographs and project films.
        </p>
      ) : (
        <div className="lp-next">
          <div>
            <span className="lc-kicker">SOMETHING CAUGHT YOUR EYE?</span>
            <h3>Let’s make room for your ideas.</h3>
          </div>
          <Link to="/callback" className="button">
            Discuss my space
          </Link>
        </div>
      )}
      <Dialog.Root open={Boolean(active)} onOpenChange={(open) => !open && setActiveId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="lp-overlay" />
          <Dialog.Content
            className="lp-viewer"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus();
            }}
            onKeyDown={(event) => {
              if (active?.kind !== "video" && event.key === "ArrowRight") {
                event.preventDefault();
                move(1);
              }
              if (active?.kind !== "video" && event.key === "ArrowLeft") {
                event.preventDefault();
                move(-1);
              }
            }}
          >
            {active && (
              <>
                <div className="lp-viewer-top">
                  <span>LUXEINFRA / OUR WORK</span>
                  <Dialog.Close className="lp-viewer-close" aria-label="Close portfolio viewer">
                    <X size={22} />
                  </Dialog.Close>
                </div>
                <div className="lp-viewer-media">
                  {active.kind === "video" ? (
                    <video
                      key={active.id}
                      src={active.src}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      aria-label={active.title}
                      aria-describedby="portfolio-media-description"
                      width={active.width}
                      height={active.height}
                    />
                  ) : (
                    <img src={active.src} alt={active.description} />
                  )}
                </div>
                <div className="lp-viewer-bottom">
                  <div>
                    <Dialog.Title>{active.title}</Dialog.Title>
                    <Dialog.Description id="portfolio-media-description">
                      {active.description}
                    </Dialog.Description>
                  </div>
                  <div className="lp-viewer-nav">
                    <button onClick={() => move(-1)} aria-label="Previous portfolio item">
                      <ChevronLeft size={20} />
                    </button>
                    <span aria-live="polite">
                      {activeIndex + 1} / {items.length}
                    </span>
                    <button onClick={() => move(1)} aria-label="Next portfolio item">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
