import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Check,
  Calculator,
  SlidersHorizontal,
  Phone,
  RotateCcw,
  LockKeyhole,
  House,
  Armchair,
  Ruler,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ContactFields } from "@/components/EnquiryContact";
import { PlannedQuoteDelivery } from "@/components/EnquiryDeliveryFeedback";
import { rooms } from "@/lib/business";
import { emptyContact, validateLead, leadMessage, type LeadContact } from "@/lib/sales-funnel";
import {
  emptyEstimate,
  estimateScopes,
  homeConfigurations,
  homeSizeThresholds,
  homeSizeLabel,
  describeEstimate,
  calculateEstimate,
  saveEstimate,
  readEstimate,
  renovationPackages,
  renovationCalculatorNote,
  renovationPricingIsReady,
  type EstimateDraft,
} from "@/lib/estimate";
import kitchen from "@/assets/kitchen.jpg";
import home from "@/assets/full-home.jpg";
import bedroom from "@/assets/bedroom.jpg";
import wardrobe from "@/assets/wardrobe.jpg";
import { planningJourney, pricingIsReady } from "@/lib/journey";

export const Route = createFileRoute("/estimate")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    scope?: string;
    room?: string;
    style?: string;
    module?: string;
    configuration?: string;
  } => ({
    scope: typeof s.scope === "string" ? s.scope.slice(0, 80) : undefined,
    room: typeof s.room === "string" && rooms.includes(s.room) ? s.room : undefined,
    style: typeof s.style === "string" ? s.style.slice(0, 80) : undefined,
    module:
      typeof s.module === "string" && ["Kitchen", "Wardrobes"].includes(s.module)
        ? s.module
        : undefined,
    configuration:
      typeof s.configuration === "string" &&
      [...homeConfigurations, "4+ BHK"].includes(s.configuration)
        ? s.configuration
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: planningJourney().title + " — LuxeInfra" },
      { name: "robots", content: "noindex, follow" },
      {
        name: "description",
        content:
          "Choose your BHK, size and interior preferences. Review your scope and decide whether to ask the studio for a quote.",
      },
    ],
  }),
  component: Estimate,
});

function PlanMark({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 76 55"
      aria-hidden="true"
      className="lf-plan-mark"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="7" y="5" width="62" height="44" rx="2" />
      <path d="M7 32h37V5M44 28h25M25 32v17M44 28v21" />
      {index > 1 && <path d="M25 5v15h19" />}
      {index > 3 && <path d="M56 5v23" />}
      <path d="M15 49h10M7 14v10M69 34v8" strokeWidth="4" stroke="#fcfbf8" />
      <path d="M15 49v-8a8 8 0 0 1 8 8" strokeWidth="1" />
    </svg>
  );
}
const freshEstimate = (): EstimateDraft => ({
  ...emptyEstimate,
  scope: "Whole home",
  condition: "Renovation",
  configuration: "",
  rooms: [],
});
function initialEstimate(
  search: { scope?: string; room?: string; module?: string; configuration?: string },
  saved: EstimateDraft | null = null,
): EstimateDraft {
  const scope = estimateScopes.includes(search.scope as EstimateDraft["scope"])
    ? (search.scope as EstimateDraft["scope"])
    : search.room
      ? "Selected rooms"
      : undefined;
  return {
    ...(saved || freshEstimate()),
    ...(scope ? { scope } : {}),
    ...(search.room ? { rooms: [search.room] } : {}),
    ...(search.module
      ? {
          scope: "Modular interiors" as const,
          kitchen: search.module === "Kitchen",
          wardrobes: search.module === "Wardrobes",
        }
      : {}),
    ...(search.configuration
      ? {
          scope: "Whole home" as const,
          configuration: search.configuration === "4+ BHK" ? "" : search.configuration,
          area: "",
          areaBand: "" as const,
          workArea: saved?.configuration === search.configuration ? saved.workArea : "",
        }
      : {}),
  };
}

function Estimate() {
  const search = Route.useSearch();
  const [draft, setDraft] = useState<EstimateDraft>(() => initialEstimate(search));
  const isRenovation = draft.scope === "Whole home" && draft.condition === "Renovation";
  const pricingEnabled = (isRenovation && renovationPricingIsReady()) || pricingIsReady();
  const selectedPackage = renovationPackages.find((tier) => tier.id === draft.renovationTier);
  const [contact, setContact] = useState<LeadContact>({ ...emptyContact });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setDraft(
      initialEstimate(
        {
          scope: search.scope,
          room: search.room,
          module: search.module,
          configuration: search.configuration,
        },
        readEstimate(),
      ),
    );
    setStep(0);
    setLoaded(true);
  }, [search.scope, search.room, search.module, search.configuration]);
  useEffect(() => {
    if (loaded) saveEstimate(draft);
  }, [draft, loaded]);
  function update<K extends keyof EstimateDraft>(key: K, value: EstimateDraft[K]) {
    setDraft((old) => ({ ...old, [key]: value }));
    setError("");
  }
  function go(next: number) {
    setStep(next);
    setError("");
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  const lead = { ...contact, city: draft.city, region: draft.region };
  function updateContact(key: keyof LeadContact, value: string) {
    if (key === "city" || key === "region") update(key, value);
    else setContact((old) => ({ ...old, [key]: value }));
    setError("");
  }
  function next() {
    if (step === 0) {
      if (draft.scope === "Whole home" && !draft.configuration) {
        setError("Choose your home type to continue.");
        return;
      }
      if (draft.scope === "Whole home" && !draft.areaBand && !draft.area) {
        setError("Choose an approximate size, or select Not sure.");
        return;
      }
      if (
        draft.scope === "Whole home" &&
        draft.area &&
        (!Number.isFinite(Number(draft.area)) ||
          Number(draft.area) <= 0 ||
          Number(draft.area) > 100000)
      ) {
        setError("Add a carpet area between 1 and 100,000 sq ft, or leave the exact size blank.");
        return;
      }
      if (draft.scope === "Modular interiors" && !draft.kitchen && !draft.wardrobes) {
        setError("Choose a kitchen, wardrobes or both.");
        return;
      }
      if (draft.scope === "Selected rooms" && !draft.rooms.length) {
        setError("Choose at least one room.");
        return;
      }
    }
    if (step === 1 && draft.scope === "Modular interiors") {
      for (const value of [
        draft.kitchen ? draft.kitchenArea : "",
        draft.wardrobes ? draft.wardrobeArea : "",
      ]) {
        if (
          value &&
          (!Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > 100000)
        ) {
          setError("Add a valid cabinet frontage, or leave measurements for the designer.");
          return;
        }
      }
    }
    if (step === 1 && isRenovation) {
      if (!selectedPackage) {
        setError("Choose Essential, Signature or Luxe to continue.");
        return;
      }
      const area = Number(draft.workArea);
      if (!draft.workArea.trim() || !Number.isFinite(area) || area < 1 || area > 100000) {
        setError(
          "Enter the floor area of work between 1 and 100,000 sq ft to calculate your budget.",
        );
        document.getElementById("renovation-work-area")?.focus();
        return;
      }
    }
    go(step === 1 && !pricingEnabled ? 3 : step + 1);
  }
  function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateLead(lead);
    if (invalid) {
      setError(invalid);
      return;
    }
    go(3);
  }
  const result = calculateEstimate(draft);
  const money = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  const selection =
    draft.scope === "Whole home"
      ? draft.configuration || "Choose your home"
      : draft.scope === "Selected rooms"
        ? draft.rooms.join(", ") || "Choose your rooms"
        : [draft.kitchen && "Kitchen", draft.wardrobes && "Wardrobes"]
            .filter(Boolean)
            .join(" + ") || "Choose your work";
  const titles = [
    draft.scope === "Whole home"
      ? "What kind of home is yours?"
      : draft.scope === "Modular interiors"
        ? "What would you like to transform?"
        : "Which rooms need a new chapter?",
    isRenovation ? "Choose the renovation that feels right." : "Let’s make it feel like you.",
    "Who are we designing for?",
    result.status === "priced"
      ? "Your indicative interiors budget."
      : "Your home plan, brought together.",
  ];
  const threshold = homeSizeThresholds[draft.configuration];
  const context =
    describeEstimate(draft) + (search.style ? "\nStyle direction: " + search.style : "");
  return (
    <PageShell>
      <section className="wrap lf-intro">
        <div>
          <span className="lf-kicker">
            <Calculator size={16} /> YOUR HOME. YOUR POSSIBILITIES.
          </span>
          <h1>{planningJourney().title}.</h1>
          <p>{planningJourney().note}</p>
        </div>
        <Link to="/callback" className="lf-switch">
          <Phone size={16} />
          <span>
            Prefer to talk?<strong>Get a quote</strong>
          </span>
        </Link>
      </section>
      <section className="wrap lf-planner">
        <div className="lf-planner-main">
          <ol className="lf-progress" aria-label="Budget planning progress">
            {(pricingEnabled
              ? ["Your home", "Your package", "Your details", "Your budget"]
              : ["Your home", "Your interiors", "Your scope"]
            ).map((label, i) => (
              <li
                key={label}
                aria-current={
                  (pricingEnabled ? step : step === 3 ? 2 : step) === i ? "step" : undefined
                }
                data-complete={(pricingEnabled ? step : step === 3 ? 2 : step) > i}
              >
                <span>{step > i ? <Check size={12} /> : i + 1}</span>
                <small>{label}</small>
              </li>
            ))}
          </ol>
          <div className="lf-step-label">
            {step === 3
              ? pricingEnabled
                ? "STEP 4 OF 4 · YOUR BUDGET"
                : "STEP 3 OF 3 · YOUR SCOPE"
              : `STEP ${step + 1} OF ${pricingEnabled ? 4 : 3}`}
          </div>
          <h2 ref={heading} tabIndex={-1} className="lf-step-heading">
            {titles[step]}
          </h2>
          {step === 0 && (
            <>
              <p className="lf-step-copy">Start with what you know. We’ll help with the rest.</p>
              <div className="lf-scope-tabs" role="group" aria-label="Interior scope">
                {(["Whole home", "Modular interiors", "Selected rooms"] as const).map(
                  (scope, i) => (
                    <button
                      type="button"
                      key={scope}
                      aria-pressed={draft.scope === scope}
                      onClick={() => update("scope", scope)}
                    >
                      {
                        [
                          <House size={16} key="h" />,
                          <Armchair size={16} key="a" />,
                          <SlidersHorizontal size={16} key="s" />,
                        ][i]
                      }
                      {["Full home", "Kitchen & wardrobes", "Selected rooms"][i]}
                    </button>
                  ),
                )}
              </div>
              {draft.scope === "Whole home" && (
                <>
                  <fieldset className="lf-choice-field">
                    <legend>Your home type</legend>
                    <div className="lf-bhk-grid">
                      {homeConfigurations.map((config, index) => (
                        <button
                          type="button"
                          key={config}
                          className="lf-bhk-card"
                          aria-pressed={draft.configuration === config}
                          onClick={() => {
                            setDraft((old) => ({
                              ...old,
                              configuration: config,
                              areaBand: "",
                              area: "",
                              workArea: "",
                            }));
                            setError("");
                          }}
                        >
                          <PlanMark index={index} />
                          <strong>{config}</strong>
                          <span>
                            {config === "1 RK"
                              ? "Studio / one room"
                              : config === "5+ BHK"
                                ? "A larger home"
                                : config.replace(" BHK", " bedroom") +
                                  (config === "1 BHK" ? "" : "s")}
                          </span>
                          <Check className="lf-choice-check" size={13} />
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {threshold && (
                    <fieldset className="lf-choice-field lf-size-reveal">
                      <legend>
                        <Ruler size={16} /> How big is your {draft.configuration}?
                      </legend>
                      <p>Approximate carpet area — the usable space inside your home.</p>
                      <div className="lf-size-options">
                        {(
                          [
                            ["up-to", `Up to ${threshold.toLocaleString("en-IN")} sq ft`],
                            ["above", `Above ${threshold.toLocaleString("en-IN")} sq ft`],
                            ["unsure", "Not sure yet"],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            type="button"
                            key={value}
                            aria-pressed={draft.areaBand === value}
                            onClick={() => {
                              setDraft((old) => ({ ...old, areaBand: value, area: "" }));
                              setError("");
                            }}
                          >
                            {label}
                            <Check size={13} />
                          </button>
                        ))}
                      </div>
                      <details className="lf-exact-size">
                        <summary>I know the exact carpet area</summary>
                        <label>
                          Carpet area (sq ft)
                          <input
                            type="number"
                            inputMode="decimal"
                            min="1"
                            max="100000"
                            value={draft.area}
                            placeholder="e.g. 780"
                            onChange={(e) => {
                              const area = e.target.value;
                              setDraft((old) => ({
                                ...old,
                                area,
                                areaBand: area
                                  ? Number(area) <= threshold
                                    ? "up-to"
                                    : "above"
                                  : "",
                              }));
                              setError("");
                            }}
                          />
                        </label>
                      </details>
                    </fieldset>
                  )}
                </>
              )}
              {draft.scope === "Modular interiors" && (
                <fieldset className="lf-choice-field">
                  <legend>Choose one, or bring both together.</legend>
                  <div className="lf-module-grid">
                    {(
                      [
                        { name: "Kitchen", key: "kitchen", image: kitchen },
                        { name: "Wardrobes", key: "wardrobes", image: wardrobe },
                      ] as const
                    ).map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        aria-pressed={draft[item.key]}
                        onClick={() => update(item.key, !draft[item.key])}
                      >
                        <img src={item.image} alt="" />
                        <span>
                          {item.name}
                          <Check size={15} />
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              {draft.scope === "Selected rooms" && (
                <fieldset className="lf-choice-field">
                  <legend>Choose the spaces you have in mind.</legend>
                  <div className="lf-room-options">
                    {rooms.map((room) => (
                      <button
                        type="button"
                        key={room}
                        aria-pressed={draft.rooms.includes(room)}
                        onClick={() =>
                          update(
                            "rooms",
                            draft.rooms.includes(room)
                              ? draft.rooms.filter((r) => r !== room)
                              : [...draft.rooms, room],
                          )
                        }
                      >
                        {room}
                        <Check size={14} />
                      </button>
                    ))}
                  </div>
                  <p>No whole-home or kitchen questions unless you choose them.</p>
                </fieldset>
              )}
            </>
          )}
          {step === 1 && (
            <div className="lf-design-step">
              <p className="lf-selection-pill">
                <Check size={14} />
                {selection}
                {draft.scope === "Whole home" ? " · " + homeSizeLabel(draft) : ""}
              </p>
              <fieldset className="lf-choice-field">
                <legend>What stage is your space at?</legend>
                <div className="lf-size-options">
                  {["New home", "Renovation"].map((condition) => (
                    <button
                      type="button"
                      key={condition}
                      aria-pressed={draft.condition === condition}
                      onClick={() => update("condition", condition)}
                    >
                      {condition}
                      <Check size={13} />
                    </button>
                  ))}
                </div>
              </fieldset>
              {isRenovation ? (
                <>
                  <fieldset className="lf-choice-field lf-renovation-packages">
                    <legend>Three ways to make it yours.</legend>
                    <p>Full-home renovation · choose the package that suits your priorities.</p>
                    <div className="lf-package-grid">
                      {renovationPackages.map((tier, index) => (
                        <button
                          type="button"
                          key={tier.id}
                          aria-pressed={draft.renovationTier === tier.id}
                          className="lf-package-card"
                          onClick={() => update("renovationTier", tier.id)}
                        >
                          <span className={`lf-package-swatch lf-package-swatch-${tier.id}`}>
                            <span>0{index + 1}</span>
                            <Check className="lf-package-check" size={16} />
                          </span>
                          <strong>{tier.name}</strong>
                          <span className="lf-package-price">
                            {money.format(tier.rate)}
                            <small>/sq ft</small>
                          </span>
                          <span className="lf-package-description">{tier.description}</span>
                          <span className="lf-package-select">
                            {draft.renovationTier === tier.id ? "Selected" : "Choose " + tier.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="lf-work-area">
                    <div>
                      <span className="lf-kicker">
                        <Ruler size={14} /> THE SPACE WE’LL WORK ON
                      </span>
                      <label htmlFor="renovation-work-area">Floor area of renovation work</label>
                      <p id="renovation-area-help">
                        Enter the actual area to be renovated. We multiply this by your package
                        rate; the home-size band is not used as a measurement.
                      </p>
                    </div>
                    <div className="lf-work-area-input">
                      <input
                        id="renovation-work-area"
                        type="number"
                        inputMode="decimal"
                        min="1"
                        max="100000"
                        step="0.01"
                        value={draft.workArea}
                        placeholder="e.g. 800"
                        aria-describedby="renovation-area-help"
                        onChange={(event) => update("workArea", event.target.value)}
                      />
                      <span>sq ft</span>
                    </div>
                  </div>
                  <p className="lf-calculator-note">{renovationCalculatorNote}</p>
                  <Link to="/callback" search={{ from: "estimate" }} className="lx-underlink">
                    Unsure of the area? Ask the studio for a quote
                  </Link>
                </>
              ) : (
                <fieldset className="lf-choice-field">
                  <legend>A finish direction for your storage</legend>
                  <p>
                    A starting preference. Final materials and specifications are discussed with
                    your designer.
                  </p>
                  <div className="lf-finish-grid">
                    {[
                      ["Laminate", "Warm, versatile surfaces", "lf-oak"],
                      ["Acrylic", "A smooth, polished look", "lf-gloss"],
                      ["Discuss with designer", "Help me choose", "lf-neutral"],
                    ].map(([finish, text, swatch]) => (
                      <button
                        type="button"
                        key={finish}
                        aria-pressed={draft.finish === finish}
                        onClick={() => update("finish", finish)}
                      >
                        <span className={swatch} />
                        <strong>{finish === "Discuss with designer" ? "Guide me" : finish}</strong>
                        <small>{text}</small>
                        <Check className="lf-choice-check" size={13} />
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              {draft.scope === "Modular interiors" && (
                <details className="lf-contact-extra">
                  <summary>
                    <Ruler size={15} /> Add cabinet measurements <span>Optional</span>
                  </summary>
                  <p>
                    Cabinet front width × height, not room floor area. Leave this for the designer
                    if unsure.
                  </p>
                  <div className="lf-input-pair">
                    {draft.kitchen && (
                      <label>
                        Kitchen frontage (sq ft)
                        <input
                          type="number"
                          min="1"
                          max="100000"
                          value={draft.kitchenArea}
                          onChange={(e) => update("kitchenArea", e.target.value)}
                          placeholder="Optional"
                        />
                      </label>
                    )}
                    {draft.wardrobes && (
                      <label>
                        Wardrobe frontage (sq ft)
                        <input
                          type="number"
                          min="1"
                          max="100000"
                          value={draft.wardrobeArea}
                          onChange={(e) => update("wardrobeArea", e.target.value)}
                          placeholder="Optional"
                        />
                      </label>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}
          {step === 2 && (
            <form onSubmit={prepare} noValidate className="lf-lead-form">
              <p className="lf-step-copy">
                Add a few essentials for a conversation about{" "}
                <strong>{selection.toLowerCase()}</strong>. Your choices are already included.
              </p>
              <ContactFields value={lead} onChange={updateContact} />
              {error && (
                <p className="lx-error" role="alert">
                  {error}
                </p>
              )}
              <div className="lf-step-actions">
                <button type="button" className="lx-underlink" onClick={() => go(1)}>
                  Back
                </button>
                <button type="submit" className="button">
                  <Check size={17} />
                  {isRenovation ? "See my budget" : "Review my quote request"}
                </button>
              </div>
              <p className="lf-disclosure">
                Review your budget on the next screen, then choose whether to send your plan to our
                team. Your contact details are not sent by this step.{" "}
                <Link to="/privacy">Privacy details</Link>
              </p>
            </form>
          )}
          {step === 3 && (
            <>
              <div className="lf-result-summary">
                <strong>{selection}</strong>
                <span>
                  {draft.scope === "Whole home" ? homeSizeLabel(draft) + " · " : ""}
                  {draft.condition} · {isRenovation ? selectedPackage?.name : draft.finish}
                </span>
                {draft.city && (
                  <span>
                    {draft.city}, {draft.region}
                  </span>
                )}
                <button type="button" className="lx-underlink" onClick={() => go(0)}>
                  <RotateCcw size={13} /> Edit my choices
                </button>
              </div>
              {result.status === "priced" ? (
                <div className="lf-priced-result">
                  <span>
                    {result.priceKind === "starting"
                      ? "YOUR RENOVATION STARTS FROM"
                      : "INDICATIVE RANGE"}
                  </span>
                  <strong>
                    {result.priceKind === "starting"
                      ? money.format(result.min) + "+"
                      : money.format(result.min!) + " – " + money.format(result.max!)}
                  </strong>
                  {result.priceKind === "starting" && (
                    <div className="lf-budget-formula">
                      <span>{result.packageName}</span>
                      <span>
                        {Number(draft.workArea).toLocaleString("en-IN")} sq ft ×{" "}
                        {money.format(result.rate)}/sq ft
                      </span>
                    </div>
                  )}
                  <p>
                    {result.reason} {result.taxNote}
                  </p>
                  {result.lines
                    .filter((line) => line.inclusions.length || line.exclusions.length)
                    .map((line) => (
                      <details key={line.id}>
                        <summary>
                          {line.id} · {line.quantity} {line.unit}
                        </summary>
                        <p>Includes: {line.inclusions.join(", ")}</p>
                        <p>Excludes: {line.exclusions.join(", ")}</p>
                      </details>
                    ))}
                  {result.priceKind === "range" && <small>Rate version: {result.version}</small>}
                </div>
              ) : (
                <div className="lf-tailored-note">
                  <Calculator size={21} />
                  <div>
                    <strong>A tailored quote for your space.</strong>
                    <p>
                      We’ll confirm the price after reviewing your scope, materials and
                      measurements. Your selections are ready to share; no instant price is
                      available for this plan.
                    </p>
                  </div>
                </div>
              )}
              {pricingEnabled ? (
                <PlannedQuoteDelivery
                  contact={lead}
                  message={leadMessage(lead, context)}
                  onEdit={() => go(2)}
                />
              ) : (
                <div className="lf-scope-next">
                  <h3>Ready to discuss your space?</h3>
                  <p>
                    Your scope is ready. Request a quote when you want to talk about specifications,
                    measurements and price.
                  </p>
                  <Link to="/callback" search={{ from: "estimate" }} className="button">
                    Get a quote
                  </Link>
                  <Link to="/design-ideas" className="text-link">
                    Keep exploring designs
                  </Link>
                </div>
              )}
            </>
          )}
          {step < 2 && (
            <>
              {error && (
                <p className="lx-error" role="alert">
                  {error}
                </p>
              )}
              <div className="lf-step-actions">
                {step > 0 ? (
                  <button type="button" className="lx-underlink" onClick={() => go(step - 1)}>
                    Back
                  </button>
                ) : (
                  <span>
                    <LockKeyhole size={13} /> No floor plan required
                  </span>
                )}
                <button type="button" className="button" onClick={next}>
                  {step === 0
                    ? isRenovation
                      ? "Choose my package"
                      : "Choose my interiors"
                    : pricingEnabled
                      ? "Continue to my details"
                      : "Review my scope"}
                  <Check size={15} />
                </button>
              </div>
              <p className="lf-funnel-note">
                {pricingEnabled
                  ? "Home & size → package & work area → contact details → starting budget."
                  : "Home & size → interiors → your scope. No contact details required to explore."}
              </p>
            </>
          )}
        </div>
        <aside className="lf-plan-aside">
          <div className="lf-aside-image">
            <img
              src={
                draft.scope === "Whole home"
                  ? home
                  : draft.scope === "Selected rooms"
                    ? bedroom
                    : draft.wardrobes && !draft.kitchen
                      ? wardrobe
                      : kitchen
              }
              alt="Interior design inspiration"
              width="600"
              height="700"
            />
            <span>DESIGNED AROUND YOUR EVERYDAY.</span>
          </div>
          <div className="lf-aside-copy">
            <span className="lf-kicker">YOUR HOME, TAKING SHAPE</span>
            <h3>{selection}</h3>
            <p>{draft.scope === "Whole home" ? homeSizeLabel(draft) : draft.scope}</p>
            <ul>
              <li>
                <Check size={15} /> Your space, your scope
              </li>
              <li>
                <Check size={15} /> Materials to suit your everyday
              </li>
              <li>
                <Check size={15} /> A personal quote conversation
              </li>
            </ul>
            <small>Inspiration image. Final scope and price are confirmed in your quotation.</small>
          </div>
        </aside>
      </section>
      <div className="wrap lf-reset">
        <button
          type="button"
          className="lx-underlink"
          onClick={() => {
            setDraft(freshEstimate());
            setContact({ ...emptyContact });
            go(0);
          }}
        >
          <RotateCcw size={15} /> Start a fresh plan
        </button>
      </div>
    </PageShell>
  );
}
