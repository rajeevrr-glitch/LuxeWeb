import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { stages } from "@/lib/business";
import { QuoteChecklist } from "@/components/QuoteChecklist";
export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "A clearer path home — LuxeInfra" }] }),
  component: Process,
});
const decisions = [
  [
    "Tell us what matters",
    "Rooms, priorities, location, and any reference plans.",
    "Your project brief is the starting point.",
  ],
  [
    "Talk through the practicalities",
    "Discuss site readiness, measurements, and your priorities.",
    "Confirm the scope that needs further design or site review.",
  ],
  [
    "Review before you approve",
    "Compare layouts, specifications, and the itemised quotation.",
    "Agree inclusions, exclusions, payment terms, and the schedule in writing.",
  ],
  [
    "Keep changes clear",
    "Review any proposed changes to design or scope.",
    "Confirm cost and schedule implications before approving changes.",
  ],
  [
    "Walk through the details",
    "Check the completed scope and note any remaining items.",
    "Review care guidance and the applicable support and warranty terms.",
  ],
];
function Process() {
  return (
    <PageShell>
      <section className="wrap process-hero">
        <span className="eyebrow">HOW WE GET THERE</span>
        <h1>
          A clearer path
          <br />
          to <em>feeling at home.</em>
        </h1>
        <p>
          Every home is different. A shared understanding of the decisions, scope, and next steps
          makes the journey easier to follow.
        </p>
        <a href="#journey" className="text-link">
          Walk through the process ↓
        </a>
        <a href="#quote-checklist" className="text-link process-tool-link">
          Review a quotation ↓
        </a>
      </section>
      <section id="journey" className="wrap journey-layout">
        <aside>
          <span className="eyebrow">FIVE CONSIDERED STEPS</span>
          <h2>
            Know what
            <br />
            comes next.
          </h2>
          <p>A project begins with a conversation. Your agreement confirms the specifics.</p>
          <Link to="/plan" className="button">
            Start my brief <ArrowUpRight size={17} />
          </Link>
        </aside>
        <div className="journey-stages">
          {stages.map(([title, desc], i) => (
            <article key={title}>
              <span className="journey-number">0{i + 1}</span>
              <div>
                <h2>{title}</h2>
                <p>{desc}</p>
                <div className="journey-decision">
                  <span className="eyebrow">YOUR PART / {decisions[i][0]}</span>
                  <p>{decisions[i][1]}</p>
                  <p>
                    <Check size={16} />
                    {decisions[i][2]}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="wrap section quote-clarity">
        <div>
          <span className="eyebrow">LESS GUESSWORK. MORE CLARITY.</span>
          <h2>
            What a clear
            <br />
            quote should tell you.
          </h2>
          <p>
            Use these questions when reviewing your project quotation. Final prices depend on
            measured quantities, agreed specifications, and site requirements.
          </p>
        </div>
        <div>
          {[
            [
              "The scope",
              "Which rooms, items, quantities, and work are included? What is excluded?",
            ],
            [
              "The specifications",
              "Which materials, finishes, hardware, and fittings have been selected?",
            ],
            [
              "The commitments",
              "What are the payment milestones, project schedule, quotation validity, and applicable support terms?",
            ],
            ["The changes", "How are additions or substitutions documented, priced, and approved?"],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <QuoteChecklist />
    </PageShell>
  );
}
