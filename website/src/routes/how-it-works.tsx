import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { QuoteChecklist } from "@/components/QuoteChecklist";
import living from "@/assets/hero-living.jpg";
import classic from "@/assets/living.jpg";
import natural from "@/assets/ideas/living/06.jpg";
import bedroom from "@/assets/ideas/bedroom/04.jpg";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "The art of making home — LuxeInfra" }] }),
  component: Process,
});

const chapters = [
  {
    number: "01",
    label: "A CONVERSATION, FIRST",
    title: "It begins with",
    emphasis: "your everyday.",
    description:
      "The morning light you love. The corner that never quite works. The people you share it with. Before we think about finishes, we want to understand what home means to you.",
    detail:
      "We discuss your rooms, priorities and location, then confirm the next consultation or site review.",
    image: natural,
    alt: "Natural interior reference with a timber sideboard, artwork and a mustard armchair",
    caption: "A CORNER WITH CHARACTER",
    tags: ["Your routines", "Your space", "Your priorities"],
  },
  {
    number: "02",
    label: "GIVING AN IDEA ITS SHAPE",
    title: "The whole room.",
    emphasis: "Every small detail.",
    description:
      "A palette that feels right. Storage that belongs. Materials you want to reach out and touch. We bring layout, light and finishes into one considered direction.",
    detail:
      "Review the proposed layout, specifications and itemised quotation. Scope, payment terms and schedule are agreed before execution.",
    image: classic,
    alt: "Living room design reference with blue seating, classic panelling and warm timber flooring",
    caption: "LIGHT, TEXTURE & PROPORTION",
    tags: ["Layout", "Material palette", "The finer details"],
  },
  {
    number: "03",
    label: "FROM DRAWINGS TO EVERYDAY LIFE",
    title: "Made to be lived in.",
    emphasis: "Made to be yours.",
    description:
      "The ideas become a space. The details come together. And what began as a conversation becomes somewhere you can settle in, slow down and feel at home.",
    detail:
      "Execution follows the agreed design and scope. Changes are reviewed before approval; the final walkthrough covers outstanding items, care and applicable support terms.",
    image: bedroom,
    alt: "Calm bedroom design reference with soft bedding, pale wood and natural light",
    caption: "A SOFTER END TO THE DAY",
    tags: ["Execution", "The final walkthrough", "Care & support"],
  },
];

const palettes = [
  {
    name: "Warm & grounded",
    image: natural,
    alt: "Warm interior inspiration with a wooden sideboard and mustard armchair",
    note: "Earthy colour. Warm timber. A little character.",
    colours: ["#9b704c", "#c9ad63", "#e7ddc8"],
    materials: ["Timber tones", "Ochre accents", "Warm neutrals"],
  },
  {
    name: "Soft & serene",
    image: bedroom,
    alt: "Light bedroom inspiration with pale wood and soft neutral bedding",
    note: "Quiet tones. Soft layers. Space to exhale.",
    colours: ["#ded9c9", "#a6ac9b", "#f4f0e7"],
    materials: ["Pale oak tones", "Sage accents", "Soft ivory"],
  },
  {
    name: "Classic & composed",
    image: classic,
    alt: "Classic living room inspiration with blue sofas and cream wall panelling",
    note: "Confident blue. Elegant lines. A timeless balance.",
    colours: ["#173d71", "#ae9163", "#e7e0d1"],
    materials: ["Signature blue", "Brass tones", "Cream neutrals"],
  },
];

function PaletteStudy() {
  const [selected, setSelected] = useState(0);
  const palette = palettes[selected];
  return (
    <section className="palette-study wrap" aria-labelledby="palette-heading">
      <div className="palette-copy">
        <span className="eyebrow">A SMALL STUDY IN ATMOSPHERE</span>
        <h2 id="palette-heading">
          Find the
          <br />
          <em>feeling.</em>
        </h2>
        <p>Colour changes the conversation. Explore three directions and see what draws you in.</p>
        <div className="palette-options" role="group" aria-label="Explore a colour direction">
          {palettes.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <span className="palette-index">0{index + 1}</span>
              {item.name}
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
        <span className="palette-disclaimer">A palette study, to inspire your own direction.</span>
      </div>
      <div className="palette-board" aria-live="polite" aria-atomic="true">
        <div className="palette-picture">
          <img src={palette.image} alt={palette.alt} loading="lazy" width="1024" height="768" />
          <span>THE MOOD / 0{selected + 1}</span>
        </div>
        <div className="palette-samples">
          {palette.materials.map((material, index) => (
            <div key={material}>
              <span style={{ backgroundColor: palette.colours[index] }} aria-hidden="true" />
              <small>{material}</small>
            </div>
          ))}
        </div>
        <p>{palette.note}</p>
      </div>
    </section>
  );
}

function Process() {
  const hash = useRouterState({ select: (state) => state.location.hash });
  const [practicalOpen, setPracticalOpen] = useState(false);
  const practical = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (hash === "quote-checklist") setPracticalOpen(true);
  }, [hash]);
  useEffect(() => {
    if (hash !== "quote-checklist" || !practicalOpen) return;
    const frame = requestAnimationFrame(() =>
      practical.current?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [hash, practicalOpen]);
  return (
    <PageShell>
      <section className="approach-opening wrap">
        <div className="approach-title">
          <span className="eyebrow">THE LUXEINFRA APPROACH</span>
          <h1>
            The art of
            <br />
            <em>making home.</em>
          </h1>
          <div className="approach-intro">
            <p>
              A thoughtful space.
              <br />A feeling of belonging.
            </p>
            <a href="#journey" className="text-link">
              The story of a space <ArrowDown size={18} />
            </a>
          </div>
          <div className="approach-signature">
            <span aria-hidden="true">Li.</span>
            <p>
              Thoughtfully planned.
              <br />
              Personally yours.
            </p>
          </div>
        </div>
        <figure className="approach-panorama">
          <img
            src={living}
            alt="Interior inspiration: a sunlit living room framed by timber and tall windows"
            fetchPriority="high"
            width="1600"
            height="1024"
          />
          <div className="approach-photo-note">
            <span>THE DETAILS MAKE</span>
            <em>the difference.</em>
            <ArrowUpRight size={23} />
          </div>
          <div className="approach-inset">
            <img
              src={bedroom}
              alt="Bedroom inspiration with soft ivory textures"
              width="1024"
              height="1024"
            />
            <span>ROOM TO SLOW DOWN.</span>
          </div>
          <figcaption>
            <span>A THOUGHTFUL JOURNEY, TOGETHER.</span>
            <span>DESIGN INSPIRATION / LIVING</span>
          </figcaption>
        </figure>
        <nav className="approach-route" aria-label="Explore the design journey">
          {[
            ["01", "Discover your everyday", "#chapter-01"],
            ["02", "Compose your space", "#chapter-02"],
            ["03", "Make it your own", "#chapter-03"],
          ].map(([number, title, href]) => (
            <a key={number} href={href}>
              <span>{number}</span>
              <strong>{title}</strong>
              <ArrowDown size={17} />
            </a>
          ))}
        </nav>
      </section>
      <section className="approach-preamble wrap" id="journey">
        <span className="eyebrow">PERSONAL BY DESIGN</span>
        <h2>
          Good spaces begin with
          <br />
          <em>understanding people.</em>
        </h2>
        <p>
          Every home has its own rhythm. Our approach leaves room for yours — from the first
          conversation to the last detail.
        </p>
      </section>
      <PaletteStudy />
      <div className="approach-chapters wrap">
        {chapters.map((chapter) => (
          <section
            className="approach-chapter"
            id={`chapter-${chapter.number}`}
            key={chapter.number}
          >
            <figure>
              <img
                src={chapter.image}
                alt={chapter.alt}
                loading="lazy"
                width="1024"
                height="1024"
              />
              <figcaption>
                <span>{chapter.caption}</span>
                <span>REFERENCE / {chapter.number}</span>
              </figcaption>
            </figure>
            <div className="chapter-copy">
              <span className="chapter-number" aria-hidden="true">
                {chapter.number}
              </span>
              <span className="eyebrow">{chapter.label}</span>
              <h2>
                {chapter.title}
                <br />
                <em>{chapter.emphasis}</em>
              </h2>
              <p>{chapter.description}</p>
              <ul className="chapter-tags">
                {chapter.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <details className="chapter-detail">
                <summary>
                  What happens at this stage <Plus size={16} />
                </summary>
                <p>{chapter.detail}</p>
              </details>
            </div>
          </section>
        ))}
      </div>
      <section className="approach-invitation wrap">
        <span className="eyebrow">NO TWO HOMES. NO TWO STORIES.</span>
        <h2>
          What will <em>yours</em> feel like?
        </h2>
        <Link to="/design-ideas" className="text-link">
          Find a little inspiration <ArrowUpRight size={19} />
        </Link>
        <p className="fine-print">
          Imagery shown is design inspiration, not a record of completed LuxeInfra projects.
        </p>
      </section>
      <details
        ref={practical}
        className="practical-drawer wrap"
        open={practicalOpen}
        onToggle={(event) => setPracticalOpen(event.currentTarget.open)}
      >
        <summary>
          <div>
            <span className="eyebrow">WHEN YOU’RE READY FOR THE DETAILS</span>
            <h2>A little practical clarity.</h2>
          </div>
          <Plus size={24} />
        </summary>
        <p className="practical-note">
          Your project agreement confirms the scope, specifications, payment milestones, schedule
          and applicable support. Use this checklist when reviewing a quotation.
        </p>
        <QuoteChecklist />
      </details>
    </PageShell>
  );
}
