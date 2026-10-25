import { useState } from "react";
import { Download, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const items = [
  {
    id: "scope",
    title: "Every room, every item",
    text: "Can you identify each room, item, quantity and unit of measurement?",
  },
  {
    id: "materials",
    title: "The details behind the finish",
    text: "Are materials, finishes, hardware and fittings described clearly enough to compare?",
  },
  {
    id: "exclusions",
    title: "What sits outside the price",
    text: "Are exclusions and optional upgrades listed, including any appliances, civil work or loose furniture?",
  },
  {
    id: "total",
    title: "The complete amount",
    text: "Are applicable taxes, delivery, installation and other charges included or separately identified?",
  },
  {
    id: "payments",
    title: "Payments tied to clear milestones",
    text: "Are payment amounts, due stages and quotation validity written down?",
  },
  {
    id: "sequence",
    title: "A workable sequence",
    text: "Are site readiness, approvals, dependencies and any proposed phases reflected in the schedule?",
  },
  {
    id: "changes",
    title: "A way to agree changes",
    text: "Is it clear how additions or substitutions affect cost and timing, and how you approve them?",
  },
  {
    id: "handover",
    title: "What happens after handover",
    text: "Are the applicable care, support and warranty terms, exclusions and contact person specified?",
  },
];

export function QuoteChecklist() {
  const [checked, setChecked] = useState<string[]>([]);
  function download() {
    const content = [
      "LUXEINFRA — QUOTATION REVIEW CHECKLIST",
      `${checked.length} of ${items.length} points marked reviewed`,
      "",
      ...items.flatMap((item) => [
        `${checked.includes(item.id) ? "[Reviewed]" : "[To confirm]"} ${item.title}`,
        item.text,
        "",
      ]),
      "This is a discussion checklist, not a quotation, approval or statement of LuxeInfra’s commercial terms.",
      "Only mark a point reviewed after checking the actual quotation. Keep unresolved questions for the team.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "LuxeInfra-quotation-review.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="quote-tool section" aria-labelledby="quote-tool-title" id="quote-checklist">
      <div className="wrap quote-tool-layout">
        <div className="quote-tool-intro">
          <span className="eyebrow">A SMALL TOOL FOR A BIG DECISION</span>
          <h2 id="quote-tool-title">
            Before you say <em>yes.</em>
          </h2>
          <p>
            A beautiful design deserves a clear quotation. Keep these questions beside you when
            reviewing yours.
          </p>
          <p className="fine-print">
            Tick each point you’ve checked in your actual quotation. This list does not approve a
            quote or confirm our commercial terms. Your selections last until you leave or reload
            this page.
          </p>
          <div className="quote-tool-progress" role="status" aria-live="polite">
            <strong>
              {checked.length}
              <span> / {items.length}</span>
            </strong>
            <p>
              {checked.length === items.length
                ? "Every point marked reviewed. Keep any open questions for the team."
                : "points marked reviewed"}
            </p>
          </div>
          <button className="button" onClick={download}>
            Download my checklist <Download size={17} />
          </button>
          {checked.length > 0 && (
            <button className="text-link checklist-reset" onClick={() => setChecked([])}>
              Clear selections
            </button>
          )}
          <Link to="/plan" className="text-link checklist-start">
            Still shaping your project? Start a brief <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="quote-tool-items">
          {items.map((item, index) => (
            <label className="quote-tool-item" key={item.id}>
              <input
                type="checkbox"
                checked={checked.includes(item.id)}
                onChange={(e) =>
                  setChecked((previous) =>
                    e.target.checked
                      ? [...previous, item.id]
                      : previous.filter((id) => id !== item.id),
                  )
                }
              />
              <span>
                <small>0{index + 1}</small>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
