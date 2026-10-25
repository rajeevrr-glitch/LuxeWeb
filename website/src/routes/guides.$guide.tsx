import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Check, Download, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { planningGuides, planningGuideText, type PlanningGuide } from "@/lib/planning-guides";

export const Route = createFileRoute("/guides/$guide")({
  loader: ({ params }) => {
    const guide = planningGuides.find((item) => item.slug === params.guide);
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.guide.title || "Planning guide"} — LuxeInfra` },
      {
        name: "description",
        content:
          loaderData?.guide.description || "Practical interior planning guides from LuxeInfra.",
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const { guide } = Route.useLoaderData();
  return <GuideArticle key={guide.slug} guide={guide} />;
}

function GuideArticle({ guide }: { guide: PlanningGuide }) {
  const [checked, setChecked] = useState<number[]>([]);
  const isQuoteGuide = guide.slug === "compare-interior-quotes";
  function download() {
    const url = URL.createObjectURL(
      new Blob([planningGuideText(guide, checked)], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `LuxeInfra-${guide.slug}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const related = planningGuides.filter((item) => item.slug !== guide.slug).slice(0, 2);
  return (
    <PageShell>
      <article className="lg-article">
        <header className="wrap lg-article-header">
          <Link to="/guides" className="lg-breadcrumb">
            <BookOpen size={16} aria-hidden="true" /> All planning guides
          </Link>
          <span className="eyebrow">{guide.category}</span>
          <h1>{guide.title}</h1>
          <p>{guide.intro}</p>
        </header>
        <div className="wrap lg-article-image">
          <img
            src={guide.image}
            alt={guide.imageAlt}
            width="1280"
            height="853"
            fetchPriority="high"
          />
          <span>INTERIOR INSPIRATION</span>
        </div>
        <div className="wrap lg-article-layout">
          <aside className="lg-contents">
            <nav aria-label="In this guide">
              <span className="eyebrow">IN THIS GUIDE</span>
              {guide.sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}>
                  <span>0{index + 1}</span>
                  {section.title}
                </a>
              ))}
              <a href="#preparation-checklist">
                <ClipboardMark />
                {isQuoteGuide ? "Quotation review checklist" : "Your preparation checklist"}
              </a>
            </nav>
            <p>
              Planning prompts to help you ask clearer questions. Project suitability, scope, price
              and terms need a separate review.
            </p>
          </aside>
          <div className="lg-article-body">
            {guide.sections.map((section, index) => (
              <section key={section.id} id={section.id} className="lg-chapter">
                <span className="lg-chapter-number">0{index + 1}</span>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
                <ul>
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>
            ))}
            <div className="lg-takeaway">
              <span className="eyebrow">ONE THING TO REMEMBER</span>
              <p>{guide.takeaway}</p>
            </div>
            {isQuoteGuide ? (
              <section
                className="lg-checklist"
                id="preparation-checklist"
                aria-labelledby="lg-checklist-title"
              >
                <span className="eyebrow">PUT IT BESIDE YOUR QUOTATION</span>
                <h2 id="lg-checklist-title">Ready for a closer look?</h2>
                <p>
                  Use our quotation review checklist to mark what you have checked and save the
                  points still to confirm. Keep the actual quotations beside you.
                </p>
                <Link to="/how-it-works" hash="quote-checklist" className="button secondary">
                  Open quotation checklist
                </Link>
              </section>
            ) : (
              <section
                className="lg-checklist"
                id="preparation-checklist"
                aria-labelledby="lg-checklist-title"
              >
                <span className="eyebrow">TAKE IT INTO YOUR CONVERSATION</span>
                <h2 id="lg-checklist-title">A small preparation list.</h2>
                <p>
                  Tick what you have ready, then save a copy of the guide. Your ticks stay on this
                  page and are not sent to the studio.
                </p>
                <div className="lg-checklist-items">
                  {guide.checklist.map((item, index) => (
                    <label key={item}>
                      <input
                        type="checkbox"
                        checked={checked.includes(index)}
                        onChange={(event) =>
                          setChecked((current) =>
                            event.target.checked
                              ? [...current, index]
                              : current.filter((value) => value !== index),
                          )
                        }
                      />
                      <span className="lg-check-box" aria-hidden="true">
                        {checked.includes(index) && <Check size={16} />}
                      </span>
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
                <div className="lg-checklist-bottom">
                  <span aria-live="polite">
                    {checked.length} of {guide.checklist.length} ready
                  </span>
                  <button type="button" className="button secondary" onClick={download}>
                    <Download size={17} /> Save this guide
                  </button>
                </div>
              </section>
            )}
            <section className="lg-article-cta">
              <span className="eyebrow">YOUR NEXT STEP</span>
              <h2>{guide.nextStep}</h2>
              <p>
                A short enquiry is enough to start. Share the space you have in mind and how we can
                reach you.
              </p>
              <Link
                to="/callback"
                search={{
                  scope: guide.quoteScope,
                  module: guide.quoteScope === "Kitchen" ? "Kitchen" : undefined,
                }}
                className="button"
              >
                <MessageCircle size={17} /> Discuss my space
              </Link>
            </section>
          </div>
        </div>
      </article>
      <section className="wrap lg-related" aria-labelledby="lg-related-title">
        <div className="lg-section-heading">
          <div>
            <span className="eyebrow">KEEP THINKING IT THROUGH</span>
            <h2 id="lg-related-title">Another useful read.</h2>
          </div>
          <Link to="/guides" className="lg-read-link">
            All guides
          </Link>
        </div>
        <div className="lg-related-grid">
          {related.map((item) => (
            <Link key={item.slug} to="/guides/$guide" params={{ guide: item.slug }}>
              <img src={item.image} alt="" loading="lazy" width="240" height="180" />
              <div>
                <span className="eyebrow">{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ClipboardMark() {
  return <Check size={15} aria-hidden="true" />;
}
