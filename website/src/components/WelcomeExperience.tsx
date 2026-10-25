import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Check,
  ArrowLeft,
  House,
  CookingPot,
  DoorOpen,
  BedDouble,
  MessageCircle,
  Building2,
  Store,
  Coffee,
  Ruler,
  Flame,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BrandLogo } from "@/components/BrandLogo";
import { ContactFields, ContactDisclosure, EnquiryHandoff } from "@/components/EnquiryContact";
import { emptyContact, validateLead, leadMessage, type LeadContact } from "@/lib/sales-funnel";
import { homeConfigurations } from "@/lib/estimate";
import {
  createWelcomeTracker,
  welcomeIsEligible,
  welcomeShouldOpen,
  welcomeIsTimely,
  welcomeDelayRemaining,
  welcomeProjectContext,
  type CommercialSpaceType,
} from "@/lib/welcome";
import { planningJourney } from "@/lib/journey";
import { openWhatsAppRequest } from "@/lib/whatsapp";
import { useEnquiryDelivery } from "@/hooks/use-enquiry-delivery";
import { diwaliCampaign } from "@/lib/campaigns";
import {
  AutomaticEnquiryReceipt,
  AutomaticDeliveryError,
} from "@/components/EnquiryDeliveryFeedback";
import living from "@/assets/hero-living.jpg";
import kitchen from "@/assets/kitchen.jpg";
import wardrobe from "@/assets/wardrobe.jpg";
import bedroom from "@/assets/bedroom.jpg";
import office from "@/assets/office.jpg";
import foyer from "@/assets/foyer.jpg";
import dining from "@/assets/dining.jpg";

const tracker = createWelcomeTracker({
  getItem: (key) => window.sessionStorage.getItem(key),
  setItem: (key, value) => window.sessionStorage.setItem(key, value),
});
const projects = [
  {
    id: "home",
    title: "Full home interiors",
    short: "Whole home",
    scope: "Whole home",
    image: living,
    Icon: House,
    line: ["Full home", "interiors."],
    detail: "Kitchens, bedrooms and living spaces planned together.",
    caption: "Everything, together",
  },
  {
    id: "kitchen",
    title: "Modular kitchen",
    short: "Kitchen",
    scope: "Modular interiors",
    image: kitchen,
    Icon: CookingPot,
    line: ["A kitchen that", "works for you."],
    detail: "Discuss your layout, storage and finishes.",
    caption: "Made for your everyday",
  },
  {
    id: "wardrobes",
    title: "Wardrobes & storage",
    short: "Wardrobes",
    scope: "Modular interiors",
    image: wardrobe,
    Icon: DoorOpen,
    line: ["Room for", "everything."],
    detail: "Plan the shelves, drawers and hanging space you need.",
    caption: "A place for everything",
  },
  {
    id: "room",
    title: "One or more rooms",
    short: "Selected rooms",
    scope: "Selected rooms",
    image: bedroom,
    Icon: BedDouble,
    line: ["Start with", "one room."],
    detail: "Tell us what you want to change in your space.",
    caption: "A smaller place to start",
  },
] as const;
type ProjectId = (typeof projects)[number]["id"] | "guidance";
const commercialProjects = [
  {
    id: "Office",
    title: "Office",
    short: "Office",
    image: office,
    Icon: Building2,
    caption: "Workspaces that work",
    line: ["Better spaces.", "Better workdays."],
    detail: "Discuss workstations, meeting spaces, lighting and storage.",
  },
  {
    id: "Shop / showroom",
    title: "Shop / showroom",
    short: "Retail space",
    image: foyer,
    Icon: Store,
    caption: "Give your brand a home",
    line: ["A space that", "says who you are."],
    detail: "Explore display, circulation and finishes for your business.",
  },
  {
    id: "Hospitality",
    title: "Hospitality",
    short: "Hospitality",
    image: dining,
    Icon: Coffee,
    caption: "Make every visit matter",
    line: ["Make room for", "good experiences."],
    detail: "Start a conversation about your café, restaurant or guest space.",
  },
] as const;

export function WelcomeExperience() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState<ProjectId | "">("");
  const [spaceKind, setSpaceKind] = useState<"home" | "commercial">("home");
  const [commercial, setCommercial] = useState<CommercialSpaceType | "">("");
  const [configuration, setConfiguration] = useState("");
  const [contact, setContact] = useState<LeadContact>({ ...emptyContact });
  const [error, setError] = useState("");
  const delivery = useEnquiryDelivery();
  const resetDelivery = delivery.reset;
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const previousPath = useRef(pathname);
  const interacted = useRef(false);
  const invitationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const eligible = welcomeIsEligible(pathname);
  const project = projects.find((item) => item.id === selection);
  const commercialProject = commercialProjects.find((item) => item.id === commercial);
  const isCommercial = spaceKind === "commercial";
  const scene = isCommercial ? commercialProject || commercialProjects[0] : project || projects[0];
  const selectionLabel = isCommercial
    ? commercial || "Commercial space"
    : project?.short || "Design guidance";

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("luxe:welcome-visibility", { detail: { open } }));
    return () => {
      window.dispatchEvent(new CustomEvent("luxe:welcome-visibility", { detail: { open: false } }));
    };
  }, [open]);

  useEffect(() => {
    if (!eligible) return;
    function openFromHeader() {
      clearTimeout(invitationTimer.current);
      invitationTimer.current = undefined;
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      interacted.current = true;
      tracker.markSeen();
      setOpen(true);
    }
    window.addEventListener("luxe-open-quote", openFromHeader);
    return () => window.removeEventListener("luxe-open-quote", openFromHeader);
  }, [eligible]);

  useEffect(() => {
    if (!eligible) return;
    const forced = new URLSearchParams(window.location.search).get("welcome") === "1";
    if (!welcomeShouldOpen(pathname, tracker.hasSeen(), interacted.current, forced)) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    // performance.now() is measured from this document's arrival, so SPA navigation
    // and remounting this component cannot restart the visitor's ten-second wait.
    const elapsedSinceArrival = () => window.performance.now();
    function invite() {
      if (cancelled || !welcomeShouldOpen(pathname, tracker.hasSeen(), interacted.current, forced))
        return;
      if (!welcomeIsTimely(elapsedSinceArrival(), forced)) {
        timer = invitationTimer.current = setTimeout(
          invite,
          welcomeDelayRemaining(elapsedSinceArrival(), forced),
        );
        return;
      }
      // Do not cover a menu, image viewer, active text entry or a background tab.
      const active = document.activeElement;
      const busy =
        document.hidden ||
        active?.matches("input, textarea, select") ||
        (active instanceof HTMLElement && active.isContentEditable) ||
        document.querySelector(
          '[role="dialog"][data-state="open"], .mobile-nav, [aria-controls="spaces-menu"][aria-expanded="true"]',
        );
      if (busy) {
        timer = invitationTimer.current = setTimeout(invite, 1000);
        return;
      }
      tracker.markSeen();
      invitationTimer.current = undefined;
      returnFocus.current = active instanceof HTMLElement ? active : null;
      setOpen(true);
    }
    timer = invitationTimer.current = setTimeout(
      invite,
      welcomeDelayRemaining(elapsedSinceArrival(), forced),
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (invitationTimer.current === timer) invitationTimer.current = undefined;
    };
  }, [pathname, eligible]);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    resetDelivery();
    setOpen(false);
    setStep(0);
    setContact({ ...emptyContact });
    setError("");
  }, [pathname, resetDelivery]);

  function changeOpen(next: boolean) {
    if (!next && delivery.sending) return;
    clearTimeout(invitationTimer.current);
    invitationTimer.current = undefined;
    interacted.current = true;
    if (next) tracker.markSeen();
    setOpen(next);
    if (!next) {
      delivery.reset();
      setContact({ ...emptyContact });
      setStep(0);
      setError("");
    }
  }
  function go(next: number) {
    setStep(next);
    setError("");
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "nearest",
      });
    });
  }
  function update(key: keyof LeadContact, value: string) {
    delivery.reset();
    setContact((old) => ({ ...old, [key]: value }));
    setError("");
  }
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
  if (!eligible) return null;
  const context = welcomeProjectContext({
    project: isCommercial ? "Commercial space" : project?.short || "Design guidance",
    commercial: isCommercial ? commercial : "",
    configuration: selection === "home" ? configuration : "",
    campaign: diwaliCampaign.id,
  });
  return (
    <>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent
          className="luxe-commerce lw-dialog"
          data-step={step}
          data-kind={spaceKind}
          aria-busy={delivery.sending}
          onEscapeKeyDown={(event) => {
            if (delivery.sending) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (delivery.sending) event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            heading.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const previous = returnFocus.current;
            const target =
              previous?.isConnected && previous.tagName !== "BODY"
                ? previous
                : document.querySelector<HTMLElement>('header a[href="/callback"], header a');
            target?.focus({ preventScroll: true });
          }}
        >
          <div className="lw-scene">
            <img
              key={scene.id}
              src={scene.image}
              alt={`${scene.short} design inspiration`}
              width="700"
              height="900"
            />
            <div className="lw-brand">
              <BrandLogo inverse className="lw-logo" />
              <span className="lw-scene-festive">
                <Flame size={14} /> THE DIWALI EDIT
              </span>
            </div>
            <div className="lw-scene-copy" key={scene.id + "-copy"}>
              <span>
                {isCommercial ? "Light up what’s next" : "A little light. A new beginning."}
              </span>
              <p>
                {scene.line[0]}
                <br />
                <em>{scene.line[1]}</em>
              </p>
              <small>{scene.detail}</small>
            </div>
            <span className="lw-reference">DESIGN INSPIRATION</span>
          </div>
          <div className="lw-content">
            <div
              className="lw-progress"
              aria-label={
                step < 2
                  ? `Quote request step ${step + 1} of 2`
                  : delivery.result
                    ? "Request submitted"
                    : "Continue in WhatsApp"
              }
            >
              {["Your space", "A few details"].map((label, i) => (
                <span
                  key={label}
                  aria-current={i === step ? "step" : undefined}
                  data-complete={step > i}
                >
                  <b>{step > i ? <Check size={10} /> : i + 1}</b>
                  {label}
                </span>
              ))}
            </div>
            <div className="lw-step" key={step}>
              {step === 0 && (
                <span className="lw-eyebrow lw-festive-eyebrow">
                  <Flame size={14} /> THE DIWALI EDIT <span>by LuxeInfra</span>
                </span>
              )}
              <DialogTitle ref={heading} tabIndex={-1} className="lw-title">
                {step === 0 ? (
                  isCommercial ? (
                    <>
                      This Diwali, <em>think bigger.</em>
                    </>
                  ) : (
                    <>
                      Light up <em>your home.</em>
                    </>
                  )
                ) : step === 1 ? (
                  "Where can we reach you?"
                ) : delivery.result ? (
                  "Request submitted"
                ) : (
                  "Continue in WhatsApp"
                )}
              </DialogTitle>
              <DialogDescription className="lw-description">
                {step === 0
                  ? isCommercial
                    ? "An office, a showroom or a place to welcome guests. Start something worth celebrating."
                    : "A festive refresh or a whole new beginning? Choose your space. We’ll help with the rest."
                  : step === 1
                    ? "We’ll include your project and contact details in the message."
                    : delivery.result
                      ? "Your request has been saved for our team."
                      : "Press Send in WhatsApp to share your request with our team."}
              </DialogDescription>
              {step === 0 && (
                <>
                  <div className="lw-space-switch" role="group" aria-label="Your space">
                    {[
                      { id: "home", title: "Home interiors", Icon: House },
                      { id: "commercial", title: "Commercial space", Icon: Building2 },
                    ].map(({ id, title, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={spaceKind === id}
                        onClick={() => {
                          if (spaceKind !== id) delivery.reset();
                          setSpaceKind(id as "home" | "commercial");
                          setError("");
                        }}
                      >
                        <Icon size={17} /> {title}
                      </button>
                    ))}
                  </div>
                  <div
                    className="lw-projects"
                    role="group"
                    aria-label={
                      isCommercial ? "Choose your commercial space" : "Choose your project"
                    }
                  >
                    {(isCommercial ? commercialProjects : projects).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={(isCommercial ? commercial : selection) === item.id}
                        onClick={() => {
                          delivery.reset();
                          if (isCommercial) {
                            setCommercial(item.id as CommercialSpaceType);
                          } else {
                            setSelection(item.id as ProjectId);
                          }
                          setError("");
                        }}
                      >
                        <img src={item.image} alt="" width="80" height="80" />
                        <span className="lw-project-label">
                          <item.Icon size={15} />
                          <strong>{item.title}</strong>
                          <small>{item.caption}</small>
                        </span>
                        <Check size={12} className="lw-project-tick" />
                      </button>
                    ))}
                  </div>
                  {selection === "home" && !isCommercial && (
                    <fieldset className="lw-home-types">
                      <legend>
                        Your home type <span>Optional</span>
                      </legend>
                      <div>
                        {homeConfigurations.map((config) => (
                          <button
                            type="button"
                            key={config}
                            aria-pressed={configuration === config}
                            onClick={() => {
                              if (configuration !== config) delivery.reset();
                              setConfiguration(config);
                            }}
                          >
                            {config}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <button
                    type="button"
                    className="lw-guidance"
                    onClick={() => {
                      delivery.reset();
                      if (isCommercial) setCommercial("");
                      else setSelection("guidance");
                      go(1);
                    }}
                  >
                    Not sure yet? Let’s talk it through
                  </button>
                  {error && (
                    <p className="lx-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="button"
                    className="button lw-primary"
                    onClick={() => {
                      if (!(isCommercial ? commercial : selection)) {
                        setError("Choose a space, or select Let’s talk it through.");
                        return;
                      }
                      go(1);
                    }}
                  >
                    <MessageCircle size={17} />
                    {isCommercial ? "Let’s plan my business space" : "Let’s plan my space"}
                  </button>
                  <p className="lw-soft-note">
                    <Ruler size={13} /> No floor plan needed to start.
                  </p>
                  <div className="lw-festive-benefit">
                    <Flame size={19} />
                    <span>
                      <strong>15% off on all works</strong>
                      <small>+ additional Diwali gifts</small>
                    </span>
                  </div>
                  <p className="lw-festive-terms">
                    Discounted amount and gift details will be confirmed in your written quotation.
                  </p>
                  <div className="lw-browse">
                    <button type="button" onClick={() => changeOpen(false)}>
                      I’m just exploring
                    </button>
                    {!isCommercial && (
                      <Link
                        to="/estimate"
                        search={{
                          scope: project?.scope || "Whole home",
                          module:
                            selection === "kitchen"
                              ? "Kitchen"
                              : selection === "wardrobes"
                                ? "Wardrobes"
                                : undefined,
                          configuration:
                            selection === "home" && configuration ? configuration : undefined,
                        }}
                        onClick={() => changeOpen(false)}
                      >
                        {planningJourney().label}
                      </Link>
                    )}
                  </div>
                </>
              )}
              {step === 1 && (
                <form noValidate onSubmit={prepare} className="lw-form">
                  <div className="lw-selection">
                    <span>
                      <Check size={13} />
                      {selectionLabel}
                      {!isCommercial && selection === "home" && configuration
                        ? " · " + configuration
                        : ""}
                    </span>
                    <button type="button" onClick={() => go(0)} disabled={delivery.sending}>
                      <ArrowLeft size={12} /> Change
                    </button>
                  </div>
                  <ContactFields
                    value={contact}
                    onChange={update}
                    disabled={delivery.sending}
                    locationLabel={isCommercial ? "Where is your space?" : "Where is your home?"}
                  />
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
                    className="button lw-primary"
                    disabled={delivery.checking || delivery.sending}
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
                  <EnquiryHandoff
                    opened
                    title="Your message is ready."
                    message={leadMessage(contact, context)}
                    onEdit={() => go(1)}
                  />
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
