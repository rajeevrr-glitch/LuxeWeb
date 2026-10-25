import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Phone, Sparkles } from "lucide-react";
import logo from "@/assets/luxe-infra-logo.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/design-ideas", label: "Design Ideas" },
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement strip */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-5 py-2 text-[11px] uppercase tracking-[0.22em]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
          <span className="hidden sm:inline">Free design consultation</span>
          <span className="sm:hidden">Free consultation</span>
          <span className="opacity-50">•</span>
          <span>45-day handover</span>
        </div>
      </div>

      <div className="border-b border-border backdrop-blur" style={{ backgroundImage: "var(--gradient-warm)" }}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="group flex items-center gap-3">
            <img src={logo} alt="Luxe Infra" className="h-12 w-auto transition duration-500 group-hover:scale-[1.04]" />
            <span className="hidden border-l border-border pl-3 font-display text-sm italic leading-tight text-muted-foreground sm:block">
              Crafted<br />Interiors
            </span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="group relative text-sm font-medium tracking-wide text-foreground/75 transition hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {n.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="tel:9026271638"
              className="flex items-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <Phone className="h-4 w-4" /> 90262 71638
            </a>
            <Link
              to="/contact"
              className="rounded-full bg-gradient-to-r from-primary to-[var(--gold)] px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-90"
            >
              Book Free Consult
            </Link>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="flex flex-col gap-1 p-5">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
            <a href="tel:9026271638" className="mt-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground">
              Call 90262 71638
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
