import { createFileRoute, Link } from "@tanstack/react-router";
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

function Process() {
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
        </div>
        <div className="approach-intro">
          <p>
            A thoughtful space.
            <br />
            A feeling of belonging.
          </p>
          <a href="#journey" className="text-link">
            The story of a space <ArrowDown size={18} />
          </a>
        </div>
        <figure className="approach-panorama">
          <img
            src={living}
            alt="Interior inspiration: a sunlit living room framed by timber and tall windows"
            fetchPriority="high"
            width="1600"
            height="1024"
          />
          <figcaption>
            <span>A THOUGHTFUL JOURNEY, TOGETHER.</span>
            <span>DESIGN INSPIRATION / LIVING</span>
          </figcaption>
        </figure>
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
      <div className="approach-chapters wrap">
        {chapters.map((chapter) => (
          <section className="approach-chapter" key={chapter.number}>
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
      <details className="practical-drawer wrap">
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
