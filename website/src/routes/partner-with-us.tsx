import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Handshake,
  MessageCircle,
  Palette,
  Users,
  Wrench,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import {
  AutomaticDeliveryError,
  AutomaticEnquiryReceipt,
} from "@/components/EnquiryDeliveryFeedback";
import { useEnquiryDelivery } from "@/hooks/use-enquiry-delivery";
import { business } from "@/lib/business";
import { openWhatsAppRequest, whatsappRequestUrl } from "@/lib/whatsapp";
import {
  partnerRoles,
  partnerRole,
  partnerMessage,
  validatePartner,
  type PartnerDraft,
} from "@/lib/partnership";
import image from "@/assets/ideas/office/02.jpg";

export const Route = createFileRoute("/partner-with-us")({
  validateSearch: (s: Record<string, unknown>): { role?: string } => ({
    role: partnerRole(s.role),
  }),
  head: () => ({
    meta: [
      { title: "Partner with LuxeInfra" },
      {
        name: "description",
        content:
          "Explore design collaborations, referrals, property partnerships, vendor opportunities and career interest with LuxeInfra.",
      },
    ],
  }),
  component: Partners,
});
const icons = [Palette, Handshake, Building2, Wrench, BriefcaseBusiness];

function Partners() {
  const search = Route.useSearch();
  const delivery = useEnquiryDelivery();
  const [draft, setDraft] = useState<PartnerDraft>({
    role: search.role || "",
    name: "",
    phone: "",
    city: "",
    organisation: "",
    note: "",
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const formHeading = useRef<HTMLHeadingElement>(null);
  const messageHeading = useRef<HTMLHeadingElement>(null);
  const message = partnerMessage(draft);
  function update(key: keyof PartnerDraft, value: string) {
    if (delivery.sending || draft[key] === value) return;
    delivery.reset();
    setDraft((d) => ({ ...d, [key]: value }));
    setReady(false);
    setError("");
  }
  function choose(role: string) {
    update("role", role);
    formHeading.current?.focus({ preventScroll: true });
    document
      .getElementById("partner-enquiry")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ready || delivery.checking || delivery.sending || delivery.result) return;
    const invalid = validatePartner(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    if (delivery.enabled) {
      const accepted = await delivery.submit({
        kind: "partner",
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        city: draft.city.trim(),
        message,
        consent: true,
      });
      if (accepted) setReady(true);
      return;
    }
    openWhatsAppRequest(message);
    setReady(true);
    requestAnimationFrame(() => messageHeading.current?.focus());
  }
  return (
    <PageShell>
      <section className="wrap lc-partner-hero">
        <div className="lc-partner-hero-copy">
          <span className="lc-kicker">
            <Handshake size={17} /> PARTNER WITH LUXEINFRA
          </span>
          <h1>
            Work with
            <br />
            <span>LuxeInfra.</span>
          </h1>
          <p>
            For designers, tradespeople, suppliers and referral partners. Tell us what you do and
            where you work.
          </p>
          <a href="#partner-opportunities" className="button">
            <Users size={18} /> See partnership options
          </a>
          <div className="lc-partner-tags">
            <span>Design</span>
            <span>Refer</span>
            <span>Create</span>
            <span>Join the team</span>
          </div>
        </div>
        <div className="lc-partner-hero-image">
          <img
            src={image}
            alt="A considered workspace with natural wood finishes, shown as design inspiration"
            width="1000"
            height="900"
            fetchPriority="high"
          />
          <div>
            <span>DESIGN & DELIVERY</span>
            <strong>
              Bring your skills
              <br />
              to the project.
            </strong>
          </div>
        </div>
      </section>
      <section
        className="wrap lc-section"
        id="partner-opportunities"
        aria-labelledby="partner-paths-title"
      >
        <div className="lc-section-head">
          <div>
            <span className="lc-kicker">PARTNERSHIP OPTIONS</span>
            <h2 id="partner-paths-title">How would you like to work with us?</h2>
            <p>Choose the option that matches your experience.</p>
          </div>
        </div>
        <div className="lc-partner-paths">
          {partnerRoles.map((role, i) => {
            const Icon = icons[i];
            return (
              <article key={role.id}>
                <span className="lc-partner-icon">
                  <Icon size={25} strokeWidth={1.6} />
                </span>
                <h3>{role.title}</h3>
                <p>{role.text}</p>
                <button type="button" className="lc-text-action" onClick={() => choose(role.id)}>
                  {role.id === "careers" ? "Introduce yourself" : "Explore this partnership"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="lc-partner-value">
        <div className="wrap lc-section">
          <div className="lc-section-head">
            <div>
              <span className="lc-kicker">WORKING TOGETHER</span>
              <h2>Discuss the details before we begin.</h2>
            </div>
          </div>
          <div className="lc-partner-values">
            {[
              [
                "01",
                "Complementary expertise",
                "Discuss how your skills or products could support a project’s design and delivery.",
              ],
              [
                "02",
                "A clear way of working",
                "Agree responsibilities, scope, commercial terms and client communication before any work begins.",
              ],
              [
                "03",
                "A relevant local connection",
                "Tell us where you work. LuxeInfra currently serves Uttar Pradesh, Delhi NCR and Bengaluru.",
              ],
            ].map(([number, title, text]) => (
              <div key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <p className="lc-fine-print">
            Partnership benefits, referral rewards and project allocations are agreed individually.
            No fixed commission, job or volume of work is promised through this page.
          </p>
        </div>
      </section>
      <section
        className="wrap lc-section lc-partner-enquiry"
        id="partner-enquiry"
        aria-labelledby="partner-form-title"
      >
        <div className="lc-partner-form-story">
          <span className="lc-kicker">INTRODUCE YOURSELF</span>
          <h2 ref={formHeading} tabIndex={-1} id="partner-form-title">
            Tell us about your work.
          </h2>
          <p>
            Tell us who you are and where you work. Share a portfolio or catalogue link in your
            message if you have one.
          </p>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Introduce yourself</strong>
                <p>Choose your interest and add a few essentials.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Send your introduction</strong>
                <p>
                  {delivery.enabled
                    ? "Submit it here for our team to review."
                    : "Continue to WhatsApp, then press Send in the chat."}
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Explore the fit</strong>
                <p>The studio can review your introduction and discuss relevant next steps.</p>
              </div>
            </li>
          </ol>
          <a href={business.phoneHref} className="lc-text-action">
            Prefer to talk? {business.phone}
          </a>
        </div>
        <div className="lc-partner-form-card">
          {!delivery.result && (
            <form onSubmit={prepare}>
              <fieldset
                disabled={delivery.sending}
                className="lx-form-fields"
                style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
              >
                <label>
                  I’m interested in
                  <select
                    value={draft.role}
                    onChange={(e) => update("role", e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choose an opportunity
                    </option>
                    {partnerRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.short}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="lx-fields-two">
                  <label>
                    Your name
                    <input
                      value={draft.name}
                      onChange={(e) => update("name", e.target.value)}
                      maxLength={80}
                      autoComplete="name"
                      required
                      placeholder="What should we call you?"
                    />
                  </label>
                  <label>
                    Mobile number
                    <input
                      type="tel"
                      inputMode="tel"
                      value={draft.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      maxLength={20}
                      autoComplete="tel"
                      required
                      placeholder="10-digit mobile number"
                    />
                  </label>
                </div>
                <label>
                  City / locality
                  <input
                    value={draft.city}
                    onChange={(e) => update("city", e.target.value)}
                    maxLength={100}
                    autoComplete="address-level2"
                    required
                    placeholder="Where do you work?"
                  />
                </label>
                <details className="lc-partner-optional">
                  <summary>
                    Add a company, portfolio or short introduction <span>Optional</span>
                  </summary>
                  <label>
                    Organisation / profession
                    <input
                      value={draft.organisation}
                      onChange={(e) => update("organisation", e.target.value)}
                      maxLength={120}
                      autoComplete="organization"
                    />
                  </label>
                  <label>
                    A little about you
                    <textarea
                      value={draft.note}
                      onChange={(e) => update("note", e.target.value)}
                      maxLength={600}
                      rows={4}
                      placeholder="Your expertise, areas covered, or a portfolio/catalogue link"
                    />
                  </label>
                  <small>{draft.note.length}/600 characters</small>
                </details>
                {error && (
                  <p className="lx-error" role="alert">
                    {error}
                  </p>
                )}
                {!ready && (
                  <>
                    <button
                      type="submit"
                      className="button"
                      disabled={delivery.checking || delivery.sending}
                    >
                      <MessageCircle size={18} />
                      {delivery.sending
                        ? "Submitting…"
                        : delivery.checking
                          ? "Please wait…"
                          : delivery.enabled
                            ? "Submit my introduction"
                            : "Continue on WhatsApp"}
                    </button>
                    <p className="lx-form-disclosure">
                      {delivery.enabled
                        ? "Submitting saves your introduction privately and notifies our team through WhatsApp. "
                        : "WhatsApp opens with your introduction. Review it and press Send there. "}
                      By {delivery.enabled ? "submitting" : "sending"}, you ask LuxeInfra to contact
                      you about this opportunity. <Link to="/privacy">Privacy details</Link>
                    </p>
                  </>
                )}
              </fieldset>
              <AutomaticDeliveryError
                error={delivery.error}
                message={message}
                pendingReference={delivery.pendingReference}
              />
            </form>
          )}
          {delivery.result && <AutomaticEnquiryReceipt result={delivery.result} />}
          {ready && !delivery.result && (
            <div className="lx-send-options" aria-live="polite">
              <span className="lc-kicker">
                <MessageCircle size={16} /> YOUR INTRODUCTION
              </span>
              <h3 ref={messageHeading} tabIndex={-1}>
                Continue in WhatsApp.
              </h3>
              <p>
                Press Send in WhatsApp to share your introduction. If the app didn’t open, use the
                button below.
              </p>
              <a
                href={whatsappRequestUrl(message)}
                target="_blank"
                rel="noreferrer"
                className="button"
              >
                <MessageCircle size={18} /> Open WhatsApp again
              </a>
              <a
                href={
                  "mailto:" +
                  business.email +
                  "?cc=" +
                  encodeURIComponent(business.alternateEmail) +
                  "&subject=" +
                  encodeURIComponent(
                    "LuxeInfra — " +
                      (partnerRoles.find((r) => r.id === draft.role)?.short ||
                        "Partnership enquiry"),
                  ) +
                  "&body=" +
                  encodeURIComponent(message)
                }
                className="lx-underlink"
              >
                Use email instead
              </a>
              <details>
                <summary>Preview my introduction</summary>
                <pre>{message}</pre>
              </details>
              <button type="button" onClick={() => setReady(false)} className="lx-underlink">
                Edit my details
              </button>
              <small>
                Opening WhatsApp does not confirm delivery. Attach your portfolio or catalogue in
                the chat if needed.
              </small>
            </div>
          )}
        </div>
      </section>
      <section className="wrap lc-section lc-partner-faq">
        <div>
          <span className="lc-kicker">BEFORE WE BEGIN</span>
          <h2>A few useful answers.</h2>
        </div>
        <div>
          {[
            [
              "Is there a joining fee or a fixed reward?",
              "There is no published joining fee or reward schedule on this website. Ask the studio for any proposed commercial terms in writing before you commit.",
            ],
            [
              "Can I send a portfolio or product catalogue?",
              "Yes. Add a link to your introduction, or attach a file when you send it through WhatsApp or email. This form does not upload files.",
            ],
            [
              "Does introducing a client guarantee a commission?",
              "No. Any referral eligibility, reward, payment trigger and client consent should be agreed in writing before an introduction.",
            ],
            [
              "Are you advertising jobs here?",
              "The Join the team option lets you express interest. It does not confirm a vacancy, interview or employment offer.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
