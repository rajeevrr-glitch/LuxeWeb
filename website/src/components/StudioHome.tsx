import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calculator,
  CheckCircle2,
  ChevronDown,
  Layers3,
  MessageCircle,
  Palette,
  Plus,
  Ruler,
} from "lucide-react";
import { PageShell } from "./PageShell";
import { MaterialBrands } from "./MaterialBrands";
import { QuoteButtonContent } from "./QuoteButtonContent";
import { TrustHighlights } from "./TrustHighlights";
import { PlanningGuidePreview } from "./PlanningGuidePreview";
import { SaveInspiration } from "./SaveInspiration";
import { FestiveFeature } from "./Campaigns";
import { planningJourney } from "@/lib/journey";
import { business, faqs, serviceAreaLabels } from "@/lib/business";
import { spaces, designsFor } from "@/lib/spaces";
import { roomThumbnail } from "@/lib/room-thumbnails";
import hero from "@/assets/hero-living.jpg";
import kitchen from "@/assets/ideas/kitchen/01.jpg";
import home from "@/assets/full-home.jpg";
import wardrobe from "@/assets/ideas/wardrobe/02.jpg";
import bedroom from "@/assets/ideas/bedroom/02.jpg";

const heroRooms = [
  {
    label: "Living room ideas",
    image: hero,
    alt: "Warm living room with ivory seating, wood panelling and a large window",
  },
  { label: "Kitchen ideas", image: kitchen, alt: "Kitchen interior design inspiration" },
  { label: "Bedroom ideas", image: bedroom, alt: "Bedroom interior design inspiration" },
];
const solutionCards = [
  {
    title: "Complete home interiors",
    tag: "Full home",
    image: home,
    slug: "full-home",
    text: "Plan your kitchen, bedrooms and living spaces together, with a room-by-room scope of work.",
    chips: ["Layouts", "Materials", "Room-by-room planning"],
  },
  {
    title: "Modular kitchens",
    tag: "Kitchen design",
    image: kitchen,
    slug: "kitchen",
    text: "Choose a layout, storage and finishes around the space you have and how you cook.",
    chips: ["Cabinetry", "Storage", "Finishes"],
  },
  {
    title: "Wardrobes & storage",
    tag: "Storage planning",
    image: wardrobe,
    slug: "wardrobe",
    text: "Work out what needs to fit, then discuss the internal layout, doors and hardware.",
    chips: ["Internal layout", "Hardware", "Finishes"],
  },
];
const galleryRooms = [
  { slug: "kitchen", title: "Kitchens" },
  { slug: "living", title: "Living rooms" },
  { slug: "bedroom", title: "Bedrooms" },
  { slug: "wardrobe", title: "Wardrobes" },
  { slug: "kids", title: "Kids’ rooms" },
  { slug: "pooja", title: "Pooja spaces" },
];
const shortcuts = [
  "full-home",
  "kitchen",
  "wardrobe",
  "bedroom",
  "living",
  "kids",
  "pooja",
  "office",
];

export function StudioHome() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [room, setRoom] = useState("kitchen");
  const [expanded, setExpanded] = useState(false);
  const allDesigns = designsFor(room);
  const designs = allDesigns.slice(0, expanded ? 6 : 3);
  const activeRoom = galleryRooms.find((item) => item.slug === room)!;
  return (
    <PageShell>
      <section className="lc-hero lc-hero-editorial wrap" aria-labelledby="home-title">
        <div className="lc-hero-scene">
          <img
            src={heroRooms[heroIndex].image}
            alt={heroRooms[heroIndex].alt}
            className="lc-hero-photo"
            width="1920"
            height="1080"
            fetchPriority="high"
          />
          <div className="lc-hero-overlay" />
          <span className="lc-photo-label">
            <span />
            {heroRooms[heroIndex].label}
          </span>
          <div className="lc-hero-copy">
            <span className="lc-overline">LuxeInfra home interiors</span>
            <h1 id="home-title">
              Kitchens,
              <br />
              wardrobes &
              <br />
              <span>complete homes.</span>
            </h1>
            <p>
              Find ideas for your space, decide what needs doing and speak with our team about your
              project.
            </p>
            <p className="lc-service-coverage">{serviceAreaLabels.join(" · ")}</p>
            <div className="lc-hero-actions">
              <Link
                to="/callback"
                className="button light quote-action"
                onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  )
                    return;
                  event.preventDefault();
                  window.dispatchEvent(new Event("luxe-open-quote"));
                }}
              >
                <QuoteButtonContent />
              </Link>
              <Link to="/design-ideas" className="lc-hero-browse">
                Explore design ideas
              </Link>
              <Link to="/reimagine" className="lc-hero-reimagine">
                <Palette size={17} /> Reimagine my room
              </Link>
            </div>
          </div>
          <div className="lc-scene-switch" role="group" aria-label="Choose hero room">
            {heroRooms.map((item, i) => (
              <button
                key={item.label}
                aria-label={"Show " + item.label}
                aria-pressed={i === heroIndex}
                onClick={() => setHeroIndex(i)}
              >
                <img src={item.image} alt="" />
                <span>{["Living", "Kitchen", "Bedroom"][i]}</span>
              </button>
            ))}
          </div>
          <span className="lc-image-note">Design inspiration</span>
        </div>
      </section>
      <TrustHighlights />
      <section className="wrap lc-room-shortcuts" aria-label="Browse rooms">
        {shortcuts.map((slug) => {
          const item = spaces.find((s) => s.slug === slug)!;
          const thumbnail = roomThumbnail(slug);
          return (
            <Link to="/design-ideas/$category" params={{ category: slug }} key={slug}>
              <img
                src={thumbnail?.src || item.image}
                srcSet={thumbnail?.srcSet}
                sizes="100px"
                alt=""
                width="100"
                height="80"
                loading="lazy"
                decoding="async"
              />
              <span>
                {slug === "full-home"
                  ? "Full home"
                  : slug === "office"
                    ? "Home office"
                    : slug === "kids"
                      ? "Kids’ rooms"
                      : slug === "pooja"
                        ? "Pooja spaces"
                        : item.title.replace(" & storage", "")}
              </span>
            </Link>
          );
        })}
      </section>
      <nav className="lc-benefit-strip" aria-label="A simpler way to start">
        <div className="wrap">
          <Link to="/my-inspiration">
            <CheckCircle2 size={23} />
            <span>
              <strong>Keep your favourite designs</strong>
              <small>Save them to your shortlist</small>
            </span>
          </Link>
          <Link to="/estimate">
            <Layers3 size={23} />
            <span>
              <strong>Work out what you need</strong>
              <small>No floor plan needed to begin</small>
            </span>
          </Link>
          <Link to="/contact">
            <MessageCircle size={23} />
            <span>
              <strong>Speak with our team</strong>
              <small>WhatsApp, email or a direct call</small>
            </span>
          </Link>
        </div>
      </nav>

      <section className="wrap lc-section" aria-labelledby="solutions-title">
        <div className="lc-section-head">
          <div>
            <span className="lc-kicker">Our services</span>
            <h2 id="solutions-title">What would you like to change?</h2>
            <p>Start with one room or plan the interiors for your whole home.</p>
          </div>
          <Link to="/services" className="lc-text-action">
            Explore our services
          </Link>
        </div>
        <div className="lc-solutions">
          {solutionCards.map((item) => (
            <article key={item.slug}>
              <Link
                to="/design-ideas/$category"
                params={{ category: item.slug }}
                className="lc-solution-photo"
              >
                <img
                  src={item.image}
                  alt={item.title + " inspiration"}
                  loading="lazy"
                  width="600"
                  height="400"
                />
                <span>{item.tag}</span>
              </Link>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <div className="lc-tags">
                  {item.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
                <Link
                  to="/design-ideas/$category"
                  params={{ category: item.slug }}
                  className="lc-text-action"
                >
                  Explore designs
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap lc-work-discovery" aria-label="Our work and client reviews">
        <div>
          <span className="lc-kicker">A closer look at LuxeInfra</span>
          <h2>The spaces. The people.</h2>
        </div>
        <div className="lc-work-discovery-links">
          <Link to="/projects">
            <Layers3 size={23} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <strong>Explore our work</strong>
              <span>Project photographs &amp; walkthroughs</span>
            </span>
          </Link>
          <Link to="/testimonials">
            <MessageCircle size={23} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <strong>Meet our clients</strong>
              <span>Visit the client reviews page</span>
            </span>
          </Link>
        </div>
      </section>
      <FestiveFeature />
      <section className="lc-gallery-section">
        <div className="wrap lc-section">
          <div className="lc-section-head">
            <div>
              <span className="lc-kicker">Design ideas</span>
              <h2>See what could work in your space.</h2>
              <p>Browse by room and save the designs you’d like to discuss.</p>
            </div>
            <Link to="/my-inspiration" className="lc-text-action">
              My saved ideas
            </Link>
          </div>
          <div className="lc-gallery-tabs" role="group" aria-label="Filter design inspiration">
            {galleryRooms.map((item) => (
              <button
                key={item.slug}
                aria-pressed={room === item.slug}
                onClick={() => {
                  setRoom(item.slug);
                  setExpanded(false);
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="lc-design-grid">
            {designs.map((design, i) => (
              <article key={design.id}>
                <div className="lc-design-photo">
                  <Link
                    to="/design-ideas/$category"
                    params={{ category: room }}
                    hash={design.id}
                    aria-label={"Explore " + design.title}
                  >
                    <img
                      src={design.image}
                      alt={design.title + " design inspiration"}
                      loading="lazy"
                      width="600"
                      height="450"
                    />
                  </Link>
                  <SaveInspiration item={design} compact />
                </div>
                <div className="lc-design-info">
                  <span>{activeRoom.title}</span>
                  <h3>Design {String(i + 1).padStart(2, "0")}</h3>
                  <Link to="/design-ideas/$category" params={{ category: room }} hash={design.id}>
                    View collection
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="lc-gallery-bottom">
            <span>Illustrative design references, not completed LuxeInfra projects.</span>
            <button
              type="button"
              className="button secondary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show fewer designs" : "More " + activeRoom.title.toLowerCase()}
              <ChevronDown size={15} className={expanded ? "lc-rotated" : ""} />
            </button>
          </div>
        </div>
      </section>

      <section className="wrap lc-section">
        <div className="lc-cost-banner">
          <div>
            <span className="lc-kicker">Project planner</span>
            <h2>
              Work out the rooms
              <br />
              and interiors you need.
            </h2>
            <p>
              Choose your BHK, approximate size and interiors. Check the summary, then request a
              quote when you’re ready.
            </p>
            <span className="lc-cost-note">
              <CheckCircle2 size={15} />
              No contact details needed to plan. Our team reviews your requirements before pricing.
            </span>
          </div>
          <div className="lc-calculators">
            {[
              { name: "Full home", image: home, scope: "Whole home", module: undefined },
              { name: "Kitchen", image: kitchen, scope: "Modular interiors", module: "Kitchen" },
              {
                name: "Wardrobes",
                image: wardrobe,
                scope: "Modular interiors",
                module: "Wardrobes",
              },
            ].map((item) => (
              <Link
                to="/estimate"
                search={{ scope: item.scope, module: item.module }}
                key={item.name}
              >
                <img src={item.image} alt="" loading="lazy" />
                <Calculator size={22} />
                <strong>{item.name}</strong>
                <span>{planningJourney().label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <MaterialBrands compact />

      <section className="wrap lc-section lc-home-tools" aria-label="More ways to explore">
        <Link to="/find-your-style">
          <Palette size={26} />
          <h3>Find your style</h3>
          <p>Compare a few room looks and see which styles you prefer.</p>
          <span>Take the style quiz</span>
        </Link>
        <Link to="/materials">
          <Layers3 size={26} />
          <h3>Compare material options</h3>
          <p>Know the questions to ask about boards, finishes and hardware.</p>
          <span>Explore the materials guide</span>
        </Link>
        <Link to="/reimagine">
          <Ruler size={26} />
          <h3>Start with your room</h3>
          <p>Restyle a photo, or use measurements to plan what fits.</p>
          <span>Open room studio</span>
        </Link>
      </section>

      <section className="lc-process">
        <div className="wrap lc-section">
          <div className="lc-section-head">
            <div>
              <span className="lc-kicker">How we work</span>
              <h2>From the first call to the finished work.</h2>
            </div>
            <Link to="/how-it-works" className="lc-text-action">
              How it works
            </Link>
          </div>
          <div className="lc-steps">
            {[
              ["01", "Discuss your project", "Tell us about your space and the work you need."],
              [
                "02",
                "Plan the design",
                "Discuss layouts, materials and an itemised scope of work.",
              ],
              ["03", "Agree the details", "Confirm the work, approvals and project schedule."],
              [
                "04",
                "Review the work",
                "Check the finished work and discuss care and applicable support.",
              ],
            ].map(([n, title, text]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="wrap lc-partner-note">
        <span>Architect, designer or property professional?</span>
        <Link to="/partner-with-us">Partner with LuxeInfra</Link>
      </div>
      <PlanningGuidePreview />
      <section className="wrap lc-section lc-faq">
        <div className="lc-section-head">
          <div>
            <span className="lc-kicker">Common questions</span>
            <h2>A few things you may want to know.</h2>
          </div>
          <a href={business.phoneHref} className="lc-text-action">
            Call our team
          </a>
        </div>
        <div>
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={17} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
