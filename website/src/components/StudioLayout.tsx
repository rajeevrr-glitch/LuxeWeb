import { InspirationLink } from "./InspirationLink";
import { BrandLogo } from "./BrandLogo";
import { QuoteButtonContent } from "./QuoteButtonContent";
import { Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Menu, X, MessageCircle, Handshake } from "lucide-react";
import { PromotionBar } from "./Campaigns";
import { getFestiveState } from "@/lib/campaigns";
import { business, serviceAreaLabels, serviceAreaSummary } from "@/lib/business";
import { spaces } from "@/lib/spaces";
import { planningJourney } from "@/lib/journey";
import { welcomeIsEligible } from "@/lib/welcome";

export function StudioHeader() {
  const [open, setOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function close(event: PointerEvent) {
      if (menu.current && !menu.current.contains(event.target as Node)) setRoomsOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (open) mobileTrigger.current?.focus();
        setOpen(false);
        if (roomsOpen) {
          setRoomsOpen(false);
          trigger.current?.focus();
        }
      }
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [roomsOpen, open]);
  const links = [
    ["/materials", "Materials"],
    ["/testimonials", "Reviews"],
    ["/how-it-works", "Our process"],
    ["/reimagine", "Reimagine"],
  ] as const;
  return (
    <header className="studio-header lx-header">
      <PromotionBar />
      <div className="studio-nav wrap">
        <Link to="/" aria-label="LuxeInfra home" className="brand">
          <BrandLogo />
        </Link>
        <>
          <nav aria-label="Main navigation" className="desktop-nav">
            <div
              className="lx-space-menu"
              ref={menu}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setRoomsOpen(false);
              }}
            >
              <button
                ref={trigger}
                className="lx-nav-trigger"
                onClick={() => setRoomsOpen(!roomsOpen)}
                aria-expanded={roomsOpen}
                aria-controls="spaces-menu"
              >
                Explore spaces <ChevronDown size={14} />
              </button>
              {roomsOpen && (
                <div className="lx-mega" id="spaces-menu">
                  <div>
                    <span className="eyebrow">MAKE ROOM FOR YOUR IDEAS</span>
                    <h2>
                      Find your
                      <br />
                      <em>kind of home.</em>
                    </h2>
                    <Link
                      to="/design-ideas"
                      onClick={() => setRoomsOpen(false)}
                      className="lx-underlink"
                    >
                      Explore all inspiration
                    </Link>
                    <Link to="/guides" onClick={() => setRoomsOpen(false)} className="lx-underlink">
                      Read our planning guides
                    </Link>
                  </div>
                  <div className="lx-mega-links">
                    {spaces.map((space) => (
                      <Link
                        key={space.slug}
                        to="/design-ideas/$category"
                        params={{ category: space.slug }}
                        onClick={() => setRoomsOpen(false)}
                      >
                        {space.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {links.map(([to, label]) => (
              <Link key={to} to={to} activeProps={{ className: "active" }}>
                {label}
              </Link>
            ))}
            <Link to="/projects">Our work</Link>
          </nav>
          <div className="nav-actions">
            <InspirationLink compact />
            <Link
              to="/callback"
              className="button compact lx-nav-budget quote-action"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  !welcomeIsEligible(window.location.pathname)
                )
                  return;
                event.preventDefault();
                window.dispatchEvent(new Event("luxe-open-quote"));
              }}
            >
              <QuoteButtonContent />
            </Link>
            <button
              ref={mobileTrigger}
              className="menu-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </>
      </div>
      <nav className="lc-category-nav" aria-label="Room collections">
        <div className="wrap">
          {["full-home", "kitchen", "wardrobe", "bedroom", "living", "kids"].map((slug) => {
            const space = spaces.find((s) => s.slug === slug)!;
            return (
              <Link to="/design-ideas/$category" params={{ category: slug }} key={slug}>
                {slug === "full-home"
                  ? "Full home interiors"
                  : slug === "kitchen"
                    ? "Modular kitchens"
                    : space.title.replace(" & storage", "")}
              </Link>
            );
          })}
          <Link to="/find-your-style">Find your style</Link>
          <Link to="/estimate">{planningJourney().label}</Link>
          <Link to="/about">The studio</Link>
          <Link to="/partner-with-us" className="lc-network-link">
            <Handshake size={14} /> Partner with us
          </Link>
        </div>
      </nav>
      {open && (
        <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation">
          <Link to="/projects" onClick={() => setOpen(false)}>
            Our work
          </Link>
          <Link to="/about" onClick={() => setOpen(false)}>
            The studio
          </Link>
          <Link to="/design-ideas" onClick={() => setOpen(false)}>
            Explore spaces
          </Link>
          {links.map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link to="/estimate" onClick={() => setOpen(false)}>
            {planningJourney().label}
          </Link>
          <Link to="/callback" onClick={() => setOpen(false)}>
            Get a quote
          </Link>
          <Link to="/find-your-style" onClick={() => setOpen(false)}>
            Find your style
          </Link>
          <Link to="/my-inspiration" onClick={() => setOpen(false)}>
            Saved inspiration
          </Link>
          <Link to="/guides" onClick={() => setOpen(false)}>
            Planning guides
          </Link>
          <Link to="/contact" onClick={() => setOpen(false)}>
            Contact
          </Link>
          {getFestiveState() !== "unavailable" && (
            <Link to="/offers" onClick={() => setOpen(false)}>
              Festive offer
            </Link>
          )}
          <Link to="/partner-with-us" onClick={() => setOpen(false)}>
            Partner with us / Join us
          </Link>
        </nav>
      )}
    </header>
  );
}
export function StudioFooter({ forPartners = false }: { forPartners?: boolean }) {
  return (
    <footer className="studio-footer lx-footer">
      <div className="wrap lx-footer-invite">
        <div>
          <span className="eyebrow">
            {forPartners ? "Work with LuxeInfra" : "Talk to our team"}
          </span>
          <h2>{forPartners ? "Let’s discuss a partnership." : "Make room for what’s next."}</h2>
        </div>
        <div>
          {forPartners ? (
            <a href="#partner-enquiry" className="button light">
              <Handshake size={17} /> Start a partnership conversation
            </a>
          ) : (
            <>
              <Link to="/callback" className="button light quote-action">
                <QuoteButtonContent />
              </Link>
              <Link to="/estimate" className="lx-footer-budget">
                {planningJourney().label}
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="wrap lx-footer-grid">
        <div>
          <Link to="/" aria-label="LuxeInfra home">
            <BrandLogo inverse />
          </Link>
          <p>
            Home and commercial interiors, considered.
            <br />
            {serviceAreaSummary}.
          </p>
          <a href={business.whatsapp} target="_blank" rel="noreferrer">
            <MessageCircle size={17} /> Chat on WhatsApp
          </a>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/design-ideas">Spaces & inspiration</Link>
          <Link to="/materials">Materials guide</Link>
          <Link to="/guides">Planning guides</Link>
          <Link to="/find-your-style">Find your style</Link>
          <Link to="/reimagine">Room studio</Link>
          <Link to="/testimonials">Reviews & client stories</Link>
        </div>
        <div>
          <h3>Plan with us</h3>
          <Link to="/estimate">{planningJourney().label}</Link>
          <Link to="/callback">Get a quote</Link>
          <Link to="/how-it-works">Our process</Link>
          <Link to="/project-brief">Detailed project brief</Link>
          {getFestiveState() !== "unavailable" && <Link to="/offers">Festive offer</Link>}
          <Link to="/partner-with-us">Partner with us / Join us</Link>
        </div>
        <div>
          <h3>Let’s connect</h3>
          <a href={business.phoneHref}>{business.phone}</a>
          <a href={business.secondaryPhoneHref}>{business.secondaryPhone}</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <a href={`mailto:${business.alternateEmail}`}>{business.alternateEmail}</a>
          <p>{serviceAreaLabels.join(" · ")}</p>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} LuxeInfra</span>
        <div>
          <Link to="/about">About us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
        <span>Interiors, considered.</span>
      </div>
    </footer>
  );
}
export function SectionTitle({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-title">
      <span className="eyebrow">{kicker}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
export function PlanLink({
  children = "Explore my options",
  scope,
}: {
  children?: React.ReactNode;
  scope?: string;
}) {
  return (
    <Link to="/plan" search={{ scope }} className="button">
      {children}
    </Link>
  );
}
