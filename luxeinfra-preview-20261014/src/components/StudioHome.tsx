import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Home, Layers3, FileUp, Check, Plus } from "lucide-react";
import { PageShell } from "./PageShell";
import { SectionTitle, PlanLink } from "./StudioLayout";
import { faqs, stages } from "@/lib/business";
import hero from "@/assets/hero-living.jpg";
import kitchen from "@/assets/kitchen.jpg";
import bedroom from "@/assets/bedroom.jpg";
import living from "@/assets/living.jpg";
import wardrobe from "@/assets/wardrobe.jpg";
import fullHome from "@/assets/full-home.jpg";

export function StudioHome() {
  return (
    <PageShell>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-line" /> SPACES WITH A LITTLE MORE YOU
          </span>
          <h1>
            A home that
            <br />
            feels like <em>you.</em>
          </h1>
          <p>
            Beautiful is personal. From your first kitchen to a whole new home, we bring your ideas
            and everyday life into one considered design.
          </p>
          <div className="hero-actions">
            <PlanLink />
            <Link className="text-link" to="/design-ideas">
              Find your inspiration <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="small-circle">
              <Check size={15} />
            </span>{" "}
            Your space. Your scope. A thoughtfully tailored estimate.
          </div>
        </div>
        <div className="hero-visual">
          <img
            className="hero-image"
            src={hero}
            alt="Sunlit living room with natural textures and sculptural furniture"
            fetchPriority="high"
            width="1600"
            height="1024"
          />
          <div className="image-caption">
            <span>THE ART OF FEELING AT HOME</span>
            <span>01 / LIVING</span>
          </div>
          <div className="hero-stamp">
            <span>A place for</span>
            <em>your everyday.</em>
            <ArrowUpRight size={26} />
          </div>
        </div>
      </section>
      <div className="location-band">
        <div className="wrap">
          <span>THOUGHTFUL INTERIORS, CLOSER TO YOU</span>
          <div>
            Uttar Pradesh <i /> Delhi NCR <i /> Bengaluru
          </div>
        </div>
      </div>
      <section className="section wrap">
        <div className="section-heading">
          <SectionTitle
            kicker="A STARTING POINT, NOT A BIG DECISION"
            title="Where shall we begin?"
          />
          <p>
            Start with what you have in mind.
            <br />
            We’ll help you connect the details.
          </p>
        </div>
        <div className="entry-grid">
          {[
            {
              n: "01",
              Icon: Home,
              title: "My whole home",
              desc: "A considered plan that brings every room together.",
              scope: "Whole home",
            },
            {
              n: "02",
              Icon: Layers3,
              title: "A room. A few upgrades.",
              desc: "Focus on the spaces that make the biggest difference.",
              scope: "Selected rooms",
            },
            {
              n: "03",
              Icon: FileUp,
              title: "I have a floor plan",
              desc: "Share your layout. Let’s see what your space can become.",
              scope: "upload",
            },
          ].map(({ n, Icon, title, desc, scope }) => (
            <Link to="/plan" search={{ scope }} key={n} className="entry-card">
              <div>
                <span className="entry-number">{n}</span>
                <Icon size={23} strokeWidth={1.3} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <span className="entry-arrow">
                <ArrowUpRight size={22} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="spaces-section">
        <div className="wrap section">
          <div className="section-heading">
            <SectionTitle
              kicker="INSPIRATION, ROOM BY ROOM"
              title="Every room. A new possibility."
            />
            <Link to="/design-ideas" className="text-link">
              Explore all spaces <ArrowRight size={18} />
            </Link>
          </div>
          <div className="spaces-grid">
            {[
              ["kitchen", "Kitchens", "Made for more than cooking.", kitchen],
              ["living", "Living spaces", "Come together. Slow down.", living],
              ["bedroom", "Bedrooms", "A softer end to your day.", bedroom],
              ["wardrobe", "Wardrobes", "Everything, in its place.", wardrobe],
            ].map(([slug, title, desc, img], i) => (
              <Link
                key={slug}
                to="/design-ideas/$category"
                params={{ category: slug }}
                className="space-card"
              >
                <div className="space-image">
                  <img src={img} alt={`${title} interior inspiration`} loading="lazy" />
                  <span>0{i + 1}</span>
                </div>
                <div className="space-label">
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                  <ArrowUpRight size={22} />
                </div>
              </Link>
            ))}
          </div>
          <p className="fine-print">
            Design inspiration from the supplied collection. Completed project stories will be added
            after verification.
          </p>
        </div>
      </section>
      <section className="section wrap story-split">
        <div className="story-image">
          <img
            src={fullHome}
            loading="lazy"
            alt="Open home interior with coordinated living and dining areas"
          />
          <span>THE BIG PICTURE. THE SMALL DETAILS.</span>
        </div>
        <div>
          <span className="eyebrow">YOUR HOME, AS A WHOLE</span>
          <h2>
            Designed around
            <br />
            how you <em>really live.</em>
          </h2>
          <p>
            A quiet corner to work. Storage that makes mornings easier. A kitchen that brings
            everyone together. Good interiors begin with your everyday.
          </p>
          <ul className="check-list">
            <li>
              <Check size={17} /> Rooms and work chosen by you
            </li>
            <li>
              <Check size={17} /> Materials and finishes discussed clearly
            </li>
            <li>
              <Check size={17} /> A scope to review before you commit
            </li>
          </ul>
          <Link to="/how-it-works" className="text-link">
            Get to know our process <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="blue-section">
        <div className="wrap plan-feature">
          <div>
            <span className="eyebrow">LESS GUESSWORK. MORE CLARITY.</span>
            <h2>
              Your floor plan.
              <br />A world of <em>possibilities.</em>
            </h2>
            <p>
              Choose what you need, share your inspiration, and add a plan if you have one. Your
              ideas become one clear project brief.
            </p>
            <Link to="/plan" search={{ scope: "upload" }} className="button light">
              Upload plan & start <FileUp size={18} />
            </Link>
            <Link to="/plan" className="subtle-link">
              No floor plan? Start here <ArrowRight size={15} />
            </Link>
          </div>
          <div className="plan-paper" aria-hidden="true">
            <div className="paper-title">
              <span>LUXEINFRA</span>
              <span>YOUR SPACE, REIMAGINED</span>
            </div>
            <svg viewBox="0 0 420 285" fill="none">
              <g stroke="currentColor" strokeWidth="3">
                <path d="M30 25H390V255H30Z M175 25V165H390 M285 25V165 M30 165H118 M155 165H175 M175 198V255 M285 165V255" />
                <path
                  strokeWidth="1"
                  d="M45 40H160V120H45Z M205 45H265V100H205Z M300 45H375V100H300Z M48 200H118V240H48Z M195 200H265V240H195Z M308 188H372V235H308Z"
                />
                <path
                  strokeWidth="1"
                  d="M118 165a37 37 0 0 1 37-37v37 M175 198a33 33 0 0 1 33-33h-33"
                />
              </g>
              <g fill="currentColor" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
                <text x="103" y="146">
                  LIVING
                </text>
                <text x="230" y="139">
                  BEDROOM
                </text>
                <text x="338" y="139">
                  BEDROOM
                </text>
                <text x="85" y="189">
                  KITCHEN
                </text>
              </g>
            </svg>
            <div className="paper-bottom">
              <span>01 / START WITH YOUR LAYOUT</span>
              <span>ILLUSTRATIVE PLAN</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section wrap">
        <SectionTitle
          kicker="THE JOURNEY, SIMPLIFIED"
          title="From first ideas to the final detail."
        />
        <div className="process-grid">
          {stages.map(([title, desc], i) => (
            <div key={title}>
              <span className="process-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section wrap faq-section">
        <SectionTitle
          kicker="A LITTLE CLARITY"
          title="Before you begin."
          text="Some things are easier when you know what to expect."
        />
        <div>
          {faqs.map(([q, a]) => (
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
