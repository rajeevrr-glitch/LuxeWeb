import { InspirationLink } from "./InspirationLink";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Menu, X, Phone, MapPin, ArrowRight } from "lucide-react";
import { business } from "@/lib/business";
import logo from "@/assets/luxe-infra-logo.png";

export function StudioHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    ["/design-ideas", "Spaces"],
    ["/reimagine", "Reimagine"],
    ["/projects", "Our work"],
    ["/how-it-works", "Our process"],
    ["/about", "The studio"],
  ] as const;
  return (
    <>
      <div className="preview-ribbon">
        PRIVATE DESIGN PREVIEW <span>·</span> Enquiries are saved on this computer. Email delivery
        is not connected.
      </div>
      <header className="studio-header">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="studio-nav wrap">
          <Link to="/" aria-label="LuxeInfra home" className="brand">
            <img src={logo} alt="" />
            <span>
              LUXE<span className="brand-light">INFRA</span>
              <small>INTERIORS, CONSIDERED.</small>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="desktop-nav">
            {links.map(([to, label]) => (
              <Link key={to} to={to} activeProps={{ className: "active" }}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <InspirationLink compact />
            <Link to="/plan" className="button compact">
              Plan my space <ArrowUpRight size={16} />
            </Link>
            <button
              className="menu-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation">
            {links.map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link to="/find-your-style" onClick={() => setOpen(false)}>
              Find your style
            </Link>
            <Link to="/my-inspiration" onClick={() => setOpen(false)}>
              My inspiration
            </Link>
            <Link to="/contact" onClick={() => setOpen(false)}>
              Contact the studio
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
export function StudioFooter() {
  return (
    <footer className="studio-footer">
      <div className="wrap footer-top">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h2>
            Let’s make room
            <br />
            for <em>your ideas.</em>
          </h2>
          <Link to="/plan" className="text-link">
            Start your project <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="footer-contact">
          <a href={business.phoneHref}>
            <Phone size={17} />
            {business.phone}
          </a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <p>
            <MapPin size={17} /> Uttar Pradesh · Delhi NCR · Bengaluru
          </p>
          <a href={business.whatsapp} target="_blank" rel="noreferrer">
            Talk on WhatsApp <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} LuxeInfra</span>
        <span>Thoughtfully planned. Personally yours.</span>
        <div>
          <Link to="/services">Services</Link>
          <Link to="/find-your-style">Find your style</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
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
  children = "Plan my space",
  scope,
}: {
  children?: React.ReactNode;
  scope?: string;
}) {
  return (
    <Link to="/plan" search={{ scope }} className="button">
      {children}
      <ArrowRight size={17} />
    </Link>
  );
}
