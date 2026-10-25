import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Layers } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { MaterialBrands } from "@/components/MaterialBrands";
import kitchen from "@/assets/kitchen.jpg";
export const Route = createFileRoute("/materials")({
  head: () => ({
    meta: [
      { title: "Materials & details — LuxeInfra" },
      {
        name: "description",
        content:
          "Know what to ask about boards, finishes and hardware. Build a clearer interior specification with LuxeInfra.",
      },
    ],
  }),
  component: Materials,
});
const chapters = [
  {
    name: "The foundation",
    label: "BOARDS & CONSTRUCTION",
    title: "What’s behind the finish?",
    text: "A beautiful cabinet starts with a clear construction specification. Compare the exact product, intended application and installation details.",
    questions: [
      "Which board type, grade, brand and thickness are specified?",
      "What is suitable for the location and exposure of this unit?",
      "How are edges, joints and cut-outs detailed?",
      "Which parts of the cabinet does this specification cover?",
    ],
  },
  {
    name: "The surface",
    label: "FINISHES & COLOUR",
    title: "The part you see. And touch.",
    text: "A photograph is a starting point. Review a physical sample, the selected colour and the proposed finish before you sign off.",
    questions: [
      "What is the exact finish, brand, colour and product code?",
      "What does it look like in the room’s lighting?",
      "How should this surface be cleaned and maintained?",
      "Which edges, handles and internal finishes are included?",
    ],
  },
  {
    name: "The movement",
    label: "HARDWARE & INTERNALS",
    title: "The details you use every day.",
    text: "Doors, drawers and internal fittings deserve their own place in your quotation. Ask for named models and quantities.",
    questions: [
      "Which hinge, runner and mechanism models are included?",
      "What are the stated load limits and intended use?",
      "Which internal accessories are included or extra?",
      "What support and manufacturer terms apply to these products?",
    ],
  },
];
function Materials() {
  const [active, setActive] = useState(0);
  const [palette, setPalette] = useState(0);
  const palettes = [
    {
      name: "Warm & grounded",
      description: "Wood tones, warm ivory and a quiet stone texture.",
      swatches: ["lx-oak", "lx-ivory-swatch", "lx-stone"],
    },
    {
      name: "Calm & collected",
      description: "Architectural blue, soft neutrals and a lighter grain.",
      swatches: ["lx-blue", "lx-ivory-swatch", "lx-oak"],
    },
    {
      name: "Soft & natural",
      description: "A relaxed mix of stone, ivory and gentle wood tones.",
      swatches: ["lx-stone", "lx-oak", "lx-ivory-swatch"],
    },
  ];
  const chapter = chapters[active];
  return (
    <PageShell>
      <section className="wrap lx-page-intro">
        <span className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</span>
        <h1>
          Beyond the look.
          <br />
          Into the <em>layers.</em>
        </h1>
        <p>
          Know what you’re choosing. A little material clarity makes for a much better conversation
          about your home.
        </p>
      </section>
      <MaterialBrands />
      <section className="wrap lx-material-feature">
        <img
          src={kitchen}
          alt="Kitchen cabinetry inspiration with warm wood and light surfaces"
          width="1024"
          height="768"
        />
        <div>
          <div className="lx-tabs" role="group" aria-label="Material guide chapters">
            {chapters.map((item, i) => (
              <button key={item.name} aria-pressed={i === active} onClick={() => setActive(i)}>
                {item.name}
              </button>
            ))}
          </div>
          <span className="eyebrow">{chapter.label}</span>
          <h2>{chapter.title}</h2>
          <p>{chapter.text}</p>
          <ul>
            {chapter.questions.map((question) => (
              <li key={question}>
                <Check size={17} />
                {question}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="wrap lx-section lx-palette-section">
        <div>
          <span className="eyebrow">THE PALETTE STUDIO</span>
          <h2>
            A feeling,
            <br />
            <em>in materials.</em>
          </h2>
          <p>
            Explore a mood before selecting a product. These are illustrative directions, not
            confirmed product specifications.
          </p>
          <div className="lx-options">
            {palettes.map((item, i) => (
              <button key={item.name} aria-pressed={palette === i} onClick={() => setPalette(i)}>
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div className="lx-palette-card">
          <div className="lx-palette-swatches">
            {palettes[palette].swatches.map((swatch, i) => (
              <div className={swatch} key={i} />
            ))}
          </div>
          <h3>{palettes[palette].name}</h3>
          <p>{palettes[palette].description}</p>
          <small>
            Colours and textures vary by screen. Approve physical samples for your project.
          </small>
        </div>
      </section>
      <section className="wrap lx-spec-note">
        <Layers size={36} strokeWidth={1} />
        <div>
          <span className="eyebrow">THE SPECIFICATION, IN WRITING</span>
          <h2>Compare the same things.</h2>
          <p>
            Ask for materials, quantities, hardware, labour, site work, taxes and exclusions in your
            quotation. A package name alone doesn’t explain what you’re buying.
          </p>
        </div>
        <Link to="/callback" search={{ material: palettes[palette].name }} className="button">
          Discuss my materials
        </Link>
      </section>
      <section className="wrap lx-spec-guide-link">
        <div>
          <h2>Two quotes. One clear comparison.</h2>
          <p>Check quantities, inclusions and specifications before comparing the total.</p>
        </div>
        <Link
          to="/guides/$guide"
          params={{ guide: "compare-interior-quotes" }}
          className="button secondary"
        >
          Read the quotation guide
        </Link>
      </section>
    </PageShell>
  );
}
