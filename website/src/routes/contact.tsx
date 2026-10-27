import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { QuoteButtonContent } from "@/components/QuoteButtonContent";
import { business, serviceAreaLabels } from "@/lib/business";
export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Let’s talk about your space. — LuxeInfra" }] }),
  component: Page,
});
function Page() {
  return (
    <PageShell>
      <section className="wrap section">
        <div className="page-intro">
          <span className="eyebrow">LUXEINFRA / CONTACT</span>
          <h1>Let’s talk about your space.</h1>
        </div>
        <div className="contact-grid">
          <div>
            <span className="eyebrow">A GOOD PLACE TO BEGIN</span>
            <h2>Your ideas are welcome here.</h2>
            <p>Get a quote, plan your interiors, or contact the studio directly.</p>
            <Link to="/callback" className="button quote-action">
              <QuoteButtonContent />
            </Link>
          </div>
          <div className="info-card">
            <h3>Contact the studio</h3>
            <p>
              <a href={business.phoneHref}>{business.phone}</a>
            </p>
            <p>
              <a href={business.secondaryPhoneHref}>{business.secondaryPhone}</a>
            </p>
            <p>
              <a href={"mailto:" + business.email}>{business.email}</a>
            </p>
            <p>
              <a className="text-link" href={business.whatsapp} target="_blank" rel="noreferrer">
                Talk on WhatsApp
              </a>
            </p>
            <p>
              <a href={`mailto:${business.alternateEmail}`}>{business.alternateEmail}</a>
            </p>
            <h3>Where we work</h3>
            <p>{serviceAreaLabels.join(" · ")}</p>
            <p>Share your city or locality so we can discuss site arrangements.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
