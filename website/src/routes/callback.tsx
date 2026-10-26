import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Phone,
  Check,
  Gift,
  House,
  CookingPot,
  DoorOpen,
  BedDouble,
  Paintbrush,
  Sparkles,
  MessageCircle,
  Building2,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ContactFields, ContactDisclosure, EnquiryHandoff } from "@/components/EnquiryContact";
import { openWhatsAppRequest } from "@/lib/whatsapp";
import { useEnquiryDelivery } from "@/hooks/use-enquiry-delivery";
import {
  AutomaticEnquiryReceipt,
  AutomaticDeliveryError,
} from "@/components/EnquiryDeliveryFeedback";
import { business, rooms } from "@/lib/business";
import { readEstimate, describeEstimate, homeSizeLabel, type EstimateDraft } from "@/lib/estimate";
import { readInspiration, type Inspiration } from "@/lib/inspiration";
import {
  readDesignComparison,
  describeDesignComparison,
  type DesignComparison,
} from "@/lib/design-comparison";
import { emptyContact, validateLead, leadMessage, type LeadContact } from "@/lib/sales-funnel";
import image from "@/assets/living.jpg";
import {
  diwaliCampaign,
  festiveCampaignContext,
  festiveOffer,
  getFestiveState,
} from "@/lib/campaigns";
import { planningJourney, quoteScope, quoteMaterial, quoteEntryStep } from "@/lib/journey";
import { spaces, designsFor } from "@/lib/spaces";
import { commercialSpaceTypes, commercialSpaceType } from "@/lib/welcome";

const designReferences = new Map(
  spaces.flatMap((space) => designsFor(space.slug)).map((design) => [design.id, design]),
);

export const Route = createFileRoute("/callback")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    city?: string;
    scope?: string;
    room?: string;
    style?: string;
    from?: string;
    material?: string;
    module?: string;
    offer?: string;
    design?: string;
    commercial?: string;
  } => ({
    city: typeof s.city === "string" ? s.city.slice(0, 100) : undefined,
    scope: typeof s.scope === "string" ? s.scope.slice(0, 80) : undefined,
    room: typeof s.room === "string" && rooms.includes(s.room) ? s.room : undefined,
    style: typeof s.style === "string" ? s.style.slice(0, 80) : undefined,
    from: s.from === "estimate" ? "estimate" : undefined,
    design: typeof s.design === "string" && designReferences.has(s.design) ? s.design : undefined,
    offer: s.offer === festiveOffer.id || s.offer === diwaliCampaign.id ? s.offer : undefined,
    material: quoteMaterial(s.material),
    commercial: commercialSpaceType(s.commercial) || undefined,
    module:
      typeof s.module === "string" && ["Kitchen", "Wardrobes"].includes(s.module)
        ? s.module
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Get a personal interiors quote — LuxeInfra" },
      { name: "robots", content: "noindex, follow" },
      {
        name: "description",
        content: "Choose your space and share a short project request with the LuxeInfra team.",
      },
    ],
  }),
  component: Callback,
});
const quoteChoices = [
  { name: "Whole home", title: "Full home", line: "Bring it all together", Icon: House },
  { name: "Kitchen", title: "Kitchen", line: "A better everyday", Icon: CookingPot },
  { name: "Wardrobes", title: "Wardrobes", line: "A place for everything", Icon: DoorOpen },
  {
    name: "Selected rooms",
    title: "Selected rooms",
    line: "Start with one space",
    Icon: BedDouble,
  },
  { name: "Renovation", title: "Renovation", line: "A fresh chapter", Icon: Paintbrush },
  {
    name: "Commercial space",
    title: "Commercial space",
    line: "Built for your business",
    Icon: Building2,
  },
  { name: "Need guidance", title: "Help me decide", line: "Explore it with us", Icon: Sparkles },
];
function Callback() {
  const search = Route.useSearch();
  const [contact, setContact] = useState<LeadContact>({ ...emptyContact, city: search.city || "" });
  const [scope, setScope] = useState(() => quoteScope(search));
  const [commercial, setCommercial] = useState(() => commercialSpaceType(search.commercial));
  const [estimate, setEstimate] = useState<EstimateDraft | null>(null);
  const [inspiration, setInspiration] = useState<Inspiration[]>([]);
  const [comparison, setComparison] = useState<DesignComparison>({ ids: [], preferences: {} });
  const [includeIdeas, setIncludeIdeas] = useState(true);
  const [step, setStep] = useState(() => quoteEntryStep(search));
  const [error, setError] = useState("");
  const delivery = useEnquiryDelivery();
  const resetDelivery = delivery.reset;
  const heading = useRef<HTMLHeadingElement>(null);
  const offerState = getFestiveState();
  const includeOffer = search.offer === festiveOffer.id && offerState !== "unavailable";
  const campaignContext = festiveCampaignContext(search.offer);
  useEffect(() => {
    const savedIdeas = readInspiration();
    setInspiration(savedIdeas);
    setComparison(readDesignComparison(savedIdeas.map((idea) => idea.id)));
    if (search.from === "estimate") {
      const saved = readEstimate();
      if (saved) {
        resetDelivery();
        setEstimate(saved);
        setContact((d) => ({ ...d, city: saved.city, region: saved.region }));
        setScope(
          saved.scope === "Modular interiors"
            ? saved.kitchen && saved.wardrobes
              ? "Kitchen & wardrobes"
              : saved.kitchen
                ? "Kitchen"
                : "Wardrobes"
            : saved.scope === "Whole home"
              ? "Whole home"
              : "Selected rooms",
        );
        setStep(1);
      }
    }
  }, [search.from, resetDelivery]);
  useEffect(() => {
    if (search.from === "estimate") return;
    resetDelivery();
    setEstimate(null);
    const known = quoteScope({ scope: search.scope, module: search.module, room: search.room });
    setScope(known);
    setCommercial(commercialSpaceType(search.commercial));
    setStep(
      quoteEntryStep({
        scope: search.scope,
        module: search.module,
        room: search.room,
        commercial: search.commercial,
      }),
    );
    setError("");
  }, [search.scope, search.module, search.room, search.commercial, search.from, resetDelivery]);
  function go(next: number) {
    setStep(next);
    setError("");
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }
  const context = [
    "Interested in: " + scope,
    scope === "Commercial space" && commercial ? "Space type: " + commercial : "",
    campaignContext,
    includeOffer
      ? offerState === "live"
        ? "Interested in: The Diwali Edit — 15% off on all works + additional Diwali gifts. Please confirm the discounted amount and gift details in my quotation."
        : "Interested in: proposed festive offer (preview only; booking terms not confirmed)."
      : "",
    estimate ? describeEstimate(estimate) : "",
    scope === "Selected rooms" && search.room ? "Room: " + search.room : "",
    search.style ? "Style direction: " + search.style : "",
    search.material ? "Material direction: " + search.material : "",
    search.design
      ? "Design reference: " +
        designReferences.get(search.design)!.title +
        " (ref: " +
        search.design +
        "; inspiration, not a completed project)"
      : "",
    includeIdeas && inspiration.length
      ? "Saved inspiration:\n" +
        inspiration.map((idea) => "- " + idea.title + " (ref: " + idea.id + ")").join("\n")
      : "",
    includeIdeas && comparison.ids.length
      ? "My design comparison:\n" + describeDesignComparison(comparison, inspiration)
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  async function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (delivery.sending || delivery.checking) return;
    const invalid = validateLead(contact);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (delivery.enabled) {
      const accepted = await delivery.submit({
        kind: "quote",
        name: contact.name,
        phone: contact.phone,
        city: contact.city,
        message: leadMessage(contact, context),
        consent: true,
      });
      if (accepted) go(2);
      return;
    }
    openWhatsAppRequest(leadMessage(contact, context));
    go(2);
  }
  function update(key: keyof LeadContact, value: string) {
    delivery.reset();
    setContact((d) => ({ ...d, [key]: value }));
    setError("");
  }
  return (
    <PageShell>
      <section className="wrap lf-quote-layout">
        <div className="lf-quote-story">
          <img
            src={image}
            alt="Living room design inspiration"
            width="1024"
            height="1100"
            fetchPriority="high"
          />
          <div className="lf-quote-story-copy">
            <span className="lf-kicker">Talk to LuxeInfra</span>
            <h1>Tell us what you need.</h1>
            <p>
              A kitchen, a complete home or a space for your business. Share a few details so our
              team can help you plan the next step.
            </p>
            <div className="lf-story-benefits">
              <span>
                <Check size={15} /> No floor plan needed to start
              </span>
              <span>
                <Check size={15} /> Speak with our interiors team
              </span>
              <span>
                <Check size={15} /> Your room and design choices are included
              </span>
            </div>
          </div>
          <span className="lf-image-credit">INTERIOR DESIGN INSPIRATION</span>
        </div>
        <div className="lf-quote-card">
          {step < 2 && (
            <ol className="lf-progress lf-quote-progress" aria-label="Quote request progress">
              {["Your project", "Your details"].map((label, i) => (
                <li
                  key={label}
                  aria-current={step === i ? "step" : undefined}
                  data-complete={step > i}
                >
                  <span>{step > i ? <Check size={12} /> : i + 1}</span>
                  <small>{label}</small>
                </li>
              ))}
            </ol>
          )}
          {step < 2 && (
            <>
              <span className="lf-step-label">
                {step === 0 ? "Your project" : "Contact details"}
              </span>
              <h2 className="lf-step-heading" ref={heading} tabIndex={-1}>
                {step === 0 ? "What are you planning?" : "Where can we reach you?"}
              </h2>
              <p className="lf-step-copy">
                {step === 0
                  ? "Choose the work you need."
                  : "Your project choices will be included with your request."}
              </p>
            </>
          )}
          {(includeOffer || campaignContext) && (
            <p className="lc-offer-context">
              <Gift size={18} />
              {offerState === "preview"
                ? "Festive offer preview — ask about the proposed 15% offer. Terms are not confirmed."
                : "The Diwali Edit — 15% off all works + additional Diwali gifts. View the offer details."}
              <Link to="/offers">View details</Link>
            </p>
          )}
          {step === 0 && (
            <>
              {search.material && (
                <p className="lf-selection-pill">
                  <Check size={14} /> Material interest included: {search.material}
                </p>
              )}
              <div
                className="lf-quote-choices"
                role="group"
                aria-label="What would you like a quote for?"
              >
                {quoteChoices.map(({ name, title, line, Icon }) => (
                  <button
                    type="button"
                    key={name}
                    aria-pressed={
                      scope === name || (name === "Kitchen" && scope === "Kitchen & wardrobes")
                    }
                    onClick={() => {
                      if (scope !== name) delivery.reset();
                      setScope(name);
                      setEstimate(null);
                      setError("");
                    }}
                  >
                    <Icon size={23} strokeWidth={1.5} />
                    <strong>{title}</strong>
                    <small>{line}</small>
                    <Check className="lf-choice-check" size={12} />
                  </button>
                ))}
              </div>
              {scope === "Commercial space" && (
                <fieldset className="lf-commercial-options">
                  <legend>
                    What kind of space? <span>Optional</span>
                  </legend>
                  <div>
                    {commercialSpaceTypes.map((type) => (
                      <button
                        type="button"
                        key={type}
                        aria-pressed={commercial === type}
                        onClick={() => {
                          if (commercial !== type) delivery.reset();
                          setCommercial(commercial === type ? "" : type);
                        }}
                      >
                        {commercial === type && <Check size={13} />} {type}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              {scope === "Kitchen & wardrobes" && (
                <p className="lf-selection-pill">
                  <Check size={13} /> Kitchen & wardrobes included
                </p>
              )}
              {scope === "Selected rooms" && search.room && (
                <p className="lf-selection-pill">
                  <BedDouble size={15} /> Your space: {search.room}
                </p>
              )}
              {estimate && (
                <p className="lf-selection-pill">
                  <Check size={14} /> Your planning selections are included.{" "}
                  <Link to="/estimate">Review</Link>
                </p>
              )}
              {error && (
                <p className="lx-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button lf-wide-button"
                type="button"
                onClick={() => {
                  if (!scope) {
                    setError("Choose what you’re planning, or select Help me decide.");
                    return;
                  }
                  go(1);
                }}
              >
                <Phone size={17} /> Continue to my details
              </button>
              <p className="lf-funnel-note">Next: your contact details. No floor plan required.</p>
            </>
          )}
          {step === 1 && (
            <form onSubmit={prepare} noValidate className="lf-lead-form">
              <div className="lf-contact-context">
                <span>
                  <Check size={14} />
                  {estimate
                    ? estimate.scope === "Whole home"
                      ? estimate.configuration + " · " + homeSizeLabel(estimate)
                      : estimate.scope === "Selected rooms"
                        ? estimate.rooms.join(", ")
                        : scope
                    : scope === "Need guidance"
                      ? "A little design guidance"
                      : scope === "Commercial space" && commercial
                        ? "Commercial · " + commercial
                        : scope}
                  {!estimate && scope === "Selected rooms" && search.room
                    ? " · " + search.room
                    : ""}
                </span>
                {estimate ? (
                  <Link to="/estimate">Edit plan</Link>
                ) : (
                  <button type="button" onClick={() => go(0)} disabled={delivery.sending}>
                    Change
                  </button>
                )}
              </div>
              <ContactFields
                value={contact}
                onChange={update}
                disabled={delivery.sending}
                locationLabel={
                  scope === "Commercial space" ? "Where is your space?" : "Where is your home?"
                }
              />
              {search.design && (
                <p className="lf-selection-pill">
                  Design reference included: {designReferences.get(search.design)!.title}
                </p>
              )}
              {search.material && (
                <p className="lf-funnel-note">Material direction included: {search.material}</p>
              )}
              {inspiration.length > 0 && (
                <label className="lf-ideas-check">
                  <input
                    type="checkbox"
                    checked={includeIdeas}
                    disabled={delivery.sending}
                    onChange={(e) => {
                      delivery.reset();
                      setIncludeIdeas(e.target.checked);
                    }}
                  />{" "}
                  Include my {inspiration.length} saved inspiration{" "}
                  {inspiration.length === 1 ? "idea" : "ideas"}
                  {comparison.ids.length > 0 && " and comparison choices"}
                </label>
              )}
              {error && (
                <p className="lx-error" role="alert">
                  {error}
                </p>
              )}
              <AutomaticDeliveryError
                error={delivery.error}
                message={leadMessage(contact, context)}
                pendingReference={delivery.pendingReference}
              />
              <button
                type="submit"
                className="button lf-wide-button"
                disabled={delivery.sending || delivery.checking}
                aria-busy={delivery.sending}
              >
                <MessageCircle size={17} />{" "}
                {delivery.sending
                  ? "Submitting…"
                  : delivery.checking
                    ? "Checking availability…"
                    : delivery.enabled
                      ? "Send my quote request"
                      : "Continue in WhatsApp"}
              </button>
              <ContactDisclosure direct automatic={delivery.enabled} />
            </form>
          )}
          {step === 2 &&
            (delivery.result ? (
              <AutomaticEnquiryReceipt result={delivery.result} />
            ) : (
              <EnquiryHandoff opened message={leadMessage(contact, context)} onEdit={() => go(1)} />
            ))}
          <div className="lf-quote-alternative">
            <Phone size={17} />
            <div>
              <span>Prefer to talk now?</span>
              <a href={business.phoneHref}>{business.phone}</a>
              <a href={business.secondaryPhoneHref}>{business.secondaryPhone}</a>
            </div>
          </div>
          {scope !== "Commercial space" && (
            <Link to="/estimate" className="lf-explore-budget">
              {planningJourney().label}
            </Link>
          )}
        </div>
      </section>
    </PageShell>
  );
}
