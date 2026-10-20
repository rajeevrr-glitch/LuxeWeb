import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import home from "@/assets/full-home.jpg";
import kitchen from "@/assets/kitchen.jpg";
import wardrobe from "@/assets/wardrobe.jpg";
import living from "@/assets/living.jpg";
export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Interiors, shaped around your scope — LuxeInfra" }] }),
  component: Services,
});
const services = [
  {
    id: "whole-home",
    title: "A home, brought together.",
    label: "WHOLE-HOME INTERIORS",
    image: home,
    desc: "A connected direction for your rooms, from the overall layout to the details you touch every day.",
    items: [
      "Layouts and design direction",
      "Room-by-room storage and cabinetry",
      "Coordinated finishes and lighting",
    ],
    scope: "Whole home",
    room: undefined,
  },
  {
    id: "kitchens",
    title: "The heart of your everyday.",
    label: "KITCHENS",
    image: kitchen,
    desc: "Begin with your cooking routine. Plan the storage, surfaces, and movement around the way you use your kitchen.",
    items: [
      "Layout and appliance planning",
      "Cabinetry and storage requirements",
      "Worktops, fittings, and finish preferences",
    ],
    scope: "Selected rooms",
    room: "Kitchen",
  },
  {
    id: "storage",
    title: "Room for everything you keep.",
    label: "WARDROBES & STORAGE",
    image: wardrobe,
    desc: "Think through what belongs inside before choosing the outside. Tell us what needs a better place.",
    items: [
      "Wardrobe organisation",
      "TV units and other cabinetry",
      "Hardware, doors, and finishes",
    ],
    scope: "Selected rooms",
    room: "Master bedroom",
  },
  {
    id: "upgrades",
    title: "A fresh chapter for your space.",
    label: "ROOM UPGRADES & RENOVATION",
    image: living,
    desc: "Focus on the work that makes a difference now. We’ll discuss what the existing site needs before agreeing the scope.",
    items: [
      "Painting, lighting, and ceilings",
      "Flooring and tiling requirements",
      "Electrical, plumbing, furniture, and decor requests",
    ],
    scope: "Selected rooms",
    room: undefined,
  },
];
function Services() {
  return (
    <PageShell>
      <section className="wrap service-intro">
        <span className="eyebrow">CHOOSE THE SCOPE. SHAPE THE SPACE.</span>
        <h1>
          A whole home.
          <br />
          Or <em>your next chapter.</em>
        </h1>
        <p>
          You don’t need to know every detail to begin. Start with the rooms and work you have in
          mind, and build a clear brief from there.
        </p>
        <nav aria-label="Service categories" className="service-anchors">
          {services.map((s) => (
            <a key={s.id} href={"#" + s.id}>
              {s.label}
              <ArrowUpRight size={14} />
            </a>
          ))}
        </nav>
      </section>
      <div className="wrap service-stories">
        {services.map((s, i) => (
          <section id={s.id} key={s.id} className="service-story">
            <div className="service-image">
              <img src={s.image} alt={`${s.label.toLowerCase()} inspiration`} loading="lazy" />
              <span>0{i + 1} / DESIGN INSPIRATION</span>
            </div>
            <div>
              <span className="eyebrow">{s.label}</span>
              <h2>{s.title}</h2>
              <p>{s.desc}</p>
              <h3>Things we can discuss</h3>
              <ul>
                {s.items.map((item) => (
                  <li key={item}>
                    <Check size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/plan" search={{ scope: s.scope, room: s.room }} className="button">
                Build my brief <ArrowUpRight size={17} />
              </Link>
            </div>
          </section>
        ))}
      </div>
      <section className="wrap section scope-note">
        <div>
          <span className="eyebrow">CLEAR FROM THE START</span>
          <h2>
            A request starts
            <br />
            the conversation.
          </h2>
          <p>
            Selecting work in the planner tells us what you need. It does not confirm a package,
            final price, or a delivery commitment.
          </p>
        </div>
        <div>
          {[
            [
              "What is included?",
              "Your written quotation should list the agreed work, quantities, materials, and exclusions. The service descriptions here are starting points for discussion.",
            ],
            [
              "What needs a site review?",
              "Existing services, dimensions, access, structural limitations, and renovation conditions may affect what can be done. Site requirements are reviewed before a final scope is confirmed.",
            ],
            [
              "Can I plan work in stages?",
              "Share your priorities in the brief. We can discuss the sequence and dependencies before deciding which work could be completed separately.",
            ],
            [
              "How do I begin?",
              "Choose your rooms and work, add a plan if you have one, and tell us your location and preferences. Your complete brief becomes the starting point for an estimate review.",
            ],
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
    </PageShell>
  );
}
