import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { PageShell } from "./PageShell";
import { SectionTitle } from "./StudioLayout";
import { faqs } from "@/lib/business";
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
            <Link className="button" to="/design-ideas">
              Explore the collection <ArrowUpRight size={17} />
            </Link>
            <Link className="text-link" to="/about">
              Meet the studio <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="small-circle">
              <Check size={15} />
            </span>{" "}
            Natural textures. Considered spaces. Your kind of home.
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
      <section className="spaces-section editorial-collection">
        <div className="wrap section">
          <div className="section-heading">
            <SectionTitle kicker="THE ROOM COLLECTION" title="Spaces to fall for." />
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
              <Check size={17} /> Spaces for the way you spend your day
            </li>
            <li>
              <Check size={17} /> A balance of texture, light and proportion
            </li>
            <li>
              <Check size={17} /> Personal details that make a room your own
            </li>
          </ul>
          <Link to="/how-it-works" className="text-link">
            Get to know our process <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="studio-manifesto wrap">
        <span className="eyebrow">THE LUXEINFRA POINT OF VIEW</span>
        <h2>
          A room should be beautiful.
          <br />
          But first, it should feel <em>like you.</em>
        </h2>
        <div className="manifesto-bottom">
          <span>Light. Texture. Room to live.</span>
          <Link to="/how-it-works" className="text-link">
            Discover our approach <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="wrap ai-home-banner">
        <img
          className="ai-home-image"
          src={living}
          alt="Interior inspiration in LuxeInfra’s ivory and blue palette"
          loading="lazy"
          width="1024"
          height="768"
        />
        <div>
          <span className="eyebrow">A NEW WAY TO BEGIN</span>
          <h2>
            Your room.
            <br />
            <em>Your what-if.</em>
          </h2>
          <p>
            Share a photograph, add your dimensions, and tell us what you imagine. Prepare a
            personal room brief, with AI concepts available once the image service is connected.
          </p>
          <Link to="/reimagine" className="button">
            Reimagine my room <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <section className="wrap discovery-banner">
        <div>
          <span className="eyebrow">LET YOUR TASTE LEAD THE WAY</span>
          <h2>
            Beautiful is personal.
            <br />
            Find <em>your direction.</em>
          </h2>
          <p>A few thoughtful choices can help put your style into words.</p>
        </div>
        <Link to="/find-your-style" className="button">
          Discover my style <ArrowUpRight size={18} />
        </Link>
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
