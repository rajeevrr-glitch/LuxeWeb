import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { QuoteButtonContent } from "./QuoteButtonContent";
import { LuxeChat } from "./LuxeChat";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { StudioHeader as SiteHeader, StudioFooter as SiteFooter } from "./StudioLayout";
import { WelcomeExperience } from "./WelcomeExperience";
import { business } from "@/lib/business";
import { planningJourney } from "@/lib/journey";

export function PageShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const focused = [
    "/estimate",
    "/callback",
    "/project-brief",
    "/reimagine",
    "/partner-with-us",
  ].includes(pathname);
  const showMobileActions = ![
    "/estimate",
    "/callback",
    "/project-brief",
    "/reimagine",
    "/partner-with-us",
  ].includes(pathname);
  return (
    <div
      className={`luxe-site luxe-commerce flex min-h-screen flex-col${focused ? " lc-focused-journey" : ""}${showMobileActions ? " lc-has-mobile-actions" : ""}`}
    >
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {focused ? (
        <footer className="wrap journey-footer">
          <span>
            Need a hand? <a href={business.phoneHref}>Call the studio</a>
          </span>
          <Link to="/privacy">Privacy</Link>
          <Link to="/design-ideas">Keep exploring</Link>
        </footer>
      ) : (
        <SiteFooter />
      )}
      <WelcomeExperience />
      <LuxeChat />
      <FloatingWhatsApp />
      {showMobileActions && (
        <nav className="lc-mobile-actions" aria-label="Quick project actions">
          <Link to="/estimate">
            <Calculator size={18} />
            {planningJourney().label}
          </Link>
          <Link to="/callback" className="quote-mobile-action">
            <QuoteButtonContent />
          </Link>
        </nav>
      )}
    </div>
  );
}
