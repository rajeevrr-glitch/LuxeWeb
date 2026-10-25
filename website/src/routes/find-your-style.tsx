import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import warm from "@/assets/living.jpg";
import classic from "@/assets/bedroom.jpg";
import natural from "@/assets/dining.jpg";
export const Route = createFileRoute("/find-your-style")({
  head: () => ({ meta: [{ title: "Find your design direction — LuxeInfra" }] }),
  component: StyleDiscovery,
});
const directions = [
  {
    name: "Warm minimal",
    image: warm,
    line: "Quiet lines. A little warmth.",
    desc: "You gravitate towards uncluttered spaces, a softer palette, and details that feel intentional. Consider simple forms and a few warm accents.",
  },
  {
    name: "Modern classic",
    image: classic,
    line: "Familiar elegance, thoughtfully refreshed.",
    desc: "You’re drawn to structure, a sense of occasion, and considered focal points. Explore framed details and a balanced composition.",
  },
  {
    name: "Natural & relaxed",
    image: natural,
    line: "Easy textures. An unhurried feeling.",
    desc: "You lean towards tactile surfaces and an informal, grounded atmosphere. Bring natural-looking textures and a gentler rhythm into the conversation.",
  },
];
const questions = [
  {
    title: "How would you like home to feel?",
    hint: "Choose the mood you keep coming back to.",
    choices: [
      "Quiet, calm, and uncluttered",
      "Elegant, composed, and welcoming",
      "Relaxed, tactile, and easy-going",
    ],
  },
  {
    title: "Which details catch your eye?",
    hint: "Go with the details you would enjoy every day.",
    choices: [
      "Clean shapes with a few warm accents",
      "Framed details and a balanced arrangement",
      "Layered textures and organic shapes",
    ],
  },
  {
    title: "What would you build the room around?",
    hint: "Think of the first thing you would choose.",
    choices: [
      "A simple piece with a beautiful silhouette",
      "A considered focal point with character",
      "Something textured, inviting, and comfortable",
    ],
  },
];
function StyleDiscovery() {
  const [answers, setAnswers] = useState<number[]>([-1, -1, -1]);
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (step > 0) heading.current?.focus();
  }, [step]);
  const scores = [0, 1, 2].map((i) => answers.filter((a) => a === i).length);
  const best = Math.max(...scores);
  const tied = scores.filter((s) => s === best).length > 1;
  const winner = directions[scores.indexOf(best)];
  const result = step === 3;
  return (
    <PageShell>
      <section className="wrap section style-discovery">
        <div className="style-discovery-intro">
          <span className="eyebrow">A DIRECTION, NOT A DEFINITION</span>
          <h1>
            Your home.
            <br />
            <em>Your kind of beautiful.</em>
          </h1>
          <p>
            Three small choices to put a feeling into words. This is a starting point for
            discussion; your home can borrow from more than one style.
          </p>
        </div>
        <div className="discovery-stage">
          {!result ? (
            <>
              <span className="eyebrow">0{step + 1} / 03</span>
              <h2 ref={heading} tabIndex={-1}>
                {questions[step].title}
              </h2>
              <p>{questions[step].hint}</p>
              <div className="discovery-choices">
                {questions[step].choices.map((c, i) => (
                  <button
                    key={c}
                    aria-pressed={answers[step] === i}
                    onClick={() => setAnswers((a) => a.map((v, index) => (index === step ? i : v)))}
                  >
                    <img src={directions[i].image} alt={`${directions[i].name} reference`} />
                    <span>
                      <small>0{i + 1}</small>
                      {c}
                      <span className="selection-dot" aria-hidden="true">
                        {answers[step] === i ? "✓" : "+"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="discovery-controls">
                {step > 0 ? (
                  <button className="text-link" onClick={() => setStep(step - 1)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : (
                  <Link className="text-link" to="/plan">
                    I’d rather discuss it
                  </Link>
                )}
                <button
                  key="next"
                  className="button"
                  disabled={answers[step] < 0}
                  onClick={() => setStep(step + 1)}
                >
                  {step === 2 ? "See my direction" : "Next choice"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          ) : (
            <div className="style-result">
              <img src={winner.image} alt="Interior inspiration for your design conversation" />
              <div>
                <span className="eyebrow">YOUR STARTING POINT</span>
                <h2 ref={heading} tabIndex={-1}>
                  {tied ? "A little of each. Entirely you." : winner.name}
                </h2>
                <p>
                  {tied
                    ? "Your choices span different directions. Keep that mix: we can use your favourite details to explore a style that feels personal."
                    : winner.desc}
                </p>
                <p className="fine-print">
                  Based only on the preferences you selected. Images are illustrative references.
                </p>
                <Link
                  className="button"
                  to="/plan"
                  search={{ style: tied ? "Help me choose" : winner.name }}
                >
                  Plan with this style
                </Link>
                <button
                  className="text-link restart-style"
                  onClick={() => {
                    setStep(0);
                    setAnswers([-1, -1, -1]);
                  }}
                >
                  <RotateCcw size={15} /> Explore again
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
