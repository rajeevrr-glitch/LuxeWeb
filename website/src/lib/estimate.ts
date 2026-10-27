export const estimateScopes = ["Modular interiors", "Whole home", "Selected rooms"] as const;
export const homeConfigurations = ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"] as const;
// Discovery bands only, not prices or substitutes for measured quantities.
export const homeSizeThresholds: Record<string, number> = {
  "1 RK": 400,
  "1 BHK": 600,
  "2 BHK": 800,
  "3 BHK": 1200,
  "4 BHK": 1600,
  "4+ BHK": 1600,
  "5+ BHK": 2000,
};
export function homeSizeLabel(draft: Pick<EstimateDraft, "configuration" | "area" | "areaBand">) {
  if (draft.area) return draft.area + " sq ft carpet area";
  const threshold = homeSizeThresholds[draft.configuration];
  if (!threshold || !draft.areaBand || draft.areaBand === "unsure") return "Size to confirm";
  return (draft.areaBand === "up-to" ? "Up to " : "Above ") + threshold + " sq ft carpet area";
}
export type EstimateScope = (typeof estimateScopes)[number];
export const renovationPackages = [
  { id: "essential", name: "Essential", rate: 1100, description: "Affordable and practical" },
  {
    id: "signature",
    name: "Signature",
    rate: 1400,
    description: "Best balance of quality and price",
  },
  { id: "luxe", name: "Luxe", rate: 1700, description: "Premium finish and experience" },
] as const;
export const renovationCalculatorNote =
  "This calculator is in its early stage. The final price will be quoted after a site visit.";
export function renovationPricingIsReady() {
  return renovationPackages.length > 0;
}
export type EstimateDraft = {
  scope: EstimateScope;
  region: string;
  city: string;
  condition: string;
  configuration: string;
  area: string;
  areaBand?: "up-to" | "above" | "unsure" | "";
  finish: string;
  rooms: string[];
  kitchen: boolean;
  wardrobes: boolean;
  kitchenArea: string;
  wardrobeArea: string;
  workArea: string;
  renovationTier: "" | (typeof renovationPackages)[number]["id"];
};
export const emptyEstimate: EstimateDraft = {
  scope: "Modular interiors",
  region: "Delhi NCR",
  city: "",
  condition: "New home",
  configuration: "2 BHK",
  area: "",
  areaBand: "",
  finish: "Discuss with designer",
  rooms: [],
  kitchen: true,
  wardrobes: false,
  kitchenArea: "",
  wardrobeArea: "",
  workArea: "",
  renovationTier: "",
};
export type Rate = {
  id: "kitchen" | "wardrobes" | "whole-home";
  scope: EstimateScope;
  region: string;
  condition: string;
  finish: string;
  configuration?: string;
  areaBand?: "up-to" | "above";
  unit: "sq ft frontage" | "package";
  min: number;
  max: number;
  minHomeArea?: number;
  maxHomeArea?: number;
  inclusions: string[];
  exclusions: string[];
};
export type RateBook = {
  version: string;
  approved: boolean;
  validUntil: string;
  taxNote: string;
  rates: Rate[];
};
// Deliberately empty: only owner-approved commercial data may enable public prices.
export const approvedRateBook: RateBook = {
  version: "awaiting-owner-rates",
  approved: false,
  validUntil: "",
  taxNote: "",
  rates: [],
};

function quantity(value: string) {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) && n > 0 && n <= 100000 ? n : null;
}
export function calculateEstimate(
  draft: EstimateDraft,
  book: RateBook = approvedRateBook,
  now = new Date(),
) {
  const review = (reason: string) => ({
    status: "review" as const,
    reason,
    lines: [] as {
      id: string;
      quantity: number;
      unit: string;
      min: number;
      max: number;
      inclusions: string[];
      exclusions: string[];
    }[],
    min: null,
    max: null,
    version: book.version,
    taxNote: book.taxNote,
  });
  if (!draft.city.trim() || !["Uttar Pradesh", "Delhi NCR", "Bengaluru"].includes(draft.region))
    return review("Confirm service availability for your city.");
  // Only the owner's full-home renovation floor-area rates are approved here.
  // Discovery bands and cabinet frontage must never substitute for work floor area.
  if (
    book === approvedRateBook &&
    draft.scope === "Whole home" &&
    draft.condition === "Renovation"
  ) {
    const selected = renovationPackages.find((tier) => tier.id === draft.renovationTier);
    if (!selected) return review("Choose a full-home renovation package.");
    const area = quantity(draft.workArea);
    if (area === null || area < 1)
      return review("Enter the floor area of renovation work to calculate a budget.");
    const total = Math.round(area * selected.rate);
    return {
      status: "priced" as const,
      priceKind: "starting" as const,
      reason: renovationCalculatorNote,
      min: total,
      max: total,
      packageName: selected.name,
      lines: [
        {
          id: "whole-home",
          quantity: area,
          unit: "sq ft of renovation work",
          min: total,
          max: total,
          inclusions: [] as string[],
          exclusions: [] as string[],
        },
      ],
      version: "owner-renovation-rates-2026-10-27",
      taxNote: "Taxes and applicable extras will be detailed in the final quotation.",
    };
  }
  const expiry = Date.parse(book.validUntil + "T23:59:59Z");
  if (!book.approved || !Number.isFinite(expiry) || expiry < now.getTime() || !book.taxNote.trim())
    return review("Your selections need a studio review before a price is available.");
  if (draft.scope === "Selected rooms")
    return review("Selected-room work needs a measured scope review.");
  const ids =
    draft.scope === "Whole home"
      ? ["whole-home"]
      : [draft.kitchen ? "kitchen" : "", draft.wardrobes ? "wardrobes" : ""].filter(Boolean);
  if (!ids.length) return review("Choose the work you want to discuss.");
  const lines = [];
  for (const id of ids) {
    const candidates = book.rates.filter(
      (r) =>
        r.id === id &&
        r.scope === draft.scope &&
        r.region === draft.region &&
        r.condition === draft.condition &&
        r.finish === draft.finish &&
        (id !== "whole-home" ||
          (r.configuration === draft.configuration &&
            (r.areaBand ? r.areaBand === draft.areaBand : !!draft.area))),
    );
    if (candidates.length !== 1) return review("A specification needs an individual quotation.");
    const rate = candidates[0];
    if (
      !Number.isFinite(rate.min) ||
      !Number.isFinite(rate.max) ||
      rate.min <= 0 ||
      rate.max < rate.min ||
      rate.max > 100000000 ||
      !rate.inclusions.length ||
      !rate.exclusions.length
    )
      return review("A specification needs an individual quotation.");
    let count: number | null;
    if (id === "whole-home") {
      const area = quantity(draft.area);
      const band = rate.areaBand && rate.areaBand === draft.areaBand;
      if (rate.unit !== "package") return review("Measurement units need review.");
      const threshold = homeSizeThresholds[draft.configuration];
      if (
        band &&
        (!threshold ||
          (area !== null && (draft.areaBand === "up-to" ? area > threshold : area <= threshold)))
      )
        return review("Your home size needs an individual quotation.");
      if (
        band &&
        area === null &&
        ((Number.isFinite(rate.minHomeArea) &&
          rate.minHomeArea! > (draft.areaBand === "up-to" ? 1 : threshold)) ||
          (Number.isFinite(rate.maxHomeArea) &&
            (draft.areaBand === "above" || rate.maxHomeArea! < threshold)))
      )
        return review("Your home size needs an individual quotation.");
      if (
        !band &&
        (area === null ||
          !Number.isFinite(rate.minHomeArea) ||
          !Number.isFinite(rate.maxHomeArea) ||
          area < rate.minHomeArea! ||
          area > rate.maxHomeArea!)
      )
        return review("Your home size needs an individual quotation.");
      if (
        band &&
        draft.area &&
        (area === null ||
          (Number.isFinite(rate.minHomeArea) && area < rate.minHomeArea!) ||
          (Number.isFinite(rate.maxHomeArea) && area > rate.maxHomeArea!))
      )
        return review("Your home size needs an individual quotation.");
      count = 1;
    } else {
      if (rate.unit !== "sq ft frontage") return review("Measurement units need review.");
      count = quantity(id === "kitchen" ? draft.kitchenArea : draft.wardrobeArea);
    }
    if (count === null)
      return review("Approximate measurements will help us price your selection.");
    lines.push({
      id,
      quantity: count,
      unit: rate.unit,
      min: Math.round(rate.min * count),
      max: Math.round(rate.max * count),
      inclusions: rate.inclusions,
      exclusions: rate.exclusions,
    });
  }
  return {
    status: "priced" as const,
    priceKind: "range" as const,
    reason: "Indicative only. Final scope, site measurements and quotation require approval.",
    min: lines.reduce((sum, line) => sum + line.min, 0),
    max: lines.reduce((sum, line) => sum + line.max, 0),
    lines,
    version: book.version,
    taxNote: book.taxNote,
  };
}
export function describeEstimate(draft: EstimateDraft) {
  const renovation =
    draft.scope === "Whole home" && draft.condition === "Renovation"
      ? renovationPackages.find((tier) => tier.id === draft.renovationTier)
      : undefined;
  const budget = renovation ? calculateEstimate(draft) : null;
  const work =
    draft.scope === "Modular interiors"
      ? [
          draft.kitchen
            ? "Kitchen" + (draft.kitchenArea ? " (" + draft.kitchenArea + " sq ft frontage)" : "")
            : "",
          draft.wardrobes
            ? "Wardrobes" +
              (draft.wardrobeArea ? " (" + draft.wardrobeArea + " sq ft frontage)" : "")
            : "",
        ]
          .filter(Boolean)
          .join(", ")
      : draft.scope === "Whole home"
        ? draft.configuration + ", " + homeSizeLabel(draft)
        : draft.rooms.join(", ");
  return [
    draft.scope,
    draft.city.trim() + ", " + draft.region,
    draft.condition,
    work,
    renovation ? `Renovation package: ${renovation.name}` : "Finish preference: " + draft.finish,
    renovation && budget?.status === "priced" && budget.priceKind === "starting"
      ? `Area of renovation work: ${draft.workArea} sq ft\nIndicative budget: ₹${budget.min.toLocaleString("en-IN")}+\n${renovationCalculatorNote}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
const draftKey = "luxeinfra-estimate-v1";
export function saveEstimate(draft: EstimateDraft) {
  try {
    sessionStorage.setItem(draftKey, JSON.stringify(draft));
  } catch {
    /* Planning still works without storage. */
  }
}
export function readEstimate(): EstimateDraft | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(draftKey) || "null");
    if (
      !raw ||
      !estimateScopes.includes(raw.scope) ||
      typeof raw.city !== "string" ||
      raw.city.length > 100 ||
      !["Uttar Pradesh", "Delhi NCR", "Bengaluru", "Other"].includes(raw.region)
    )
      return null;
    return {
      ...emptyEstimate,
      scope: raw.scope,
      region: raw.region,
      city: raw.city,
      condition: ["New home", "Renovation"].includes(raw.condition)
        ? raw.condition
        : emptyEstimate.condition,
      configuration: [...homeConfigurations, ""].includes(raw.configuration)
        ? raw.configuration
        : "",
      area: typeof raw.area === "string" ? raw.area.slice(0, 8) : "",
      areaBand: ["up-to", "above", "unsure"].includes(raw.areaBand) ? raw.areaBand : "",
      finish: ["Laminate", "Acrylic", "Discuss with designer"].includes(raw.finish)
        ? raw.finish
        : emptyEstimate.finish,
      rooms: Array.isArray(raw.rooms)
        ? [
            ...new Set<string>(
              raw.rooms.filter(
                (r: unknown) =>
                  typeof r === "string" &&
                  [
                    "Kitchen",
                    "Living & dining",
                    "Master bedroom",
                    "Other bedrooms",
                    "Bathrooms",
                    "Home office",
                    "Pooja space",
                    "Other space",
                  ].includes(r),
              ),
            ),
          ].slice(0, 8)
        : [],
      kitchen: raw.kitchen === true,
      wardrobes: raw.wardrobes === true,
      kitchenArea: typeof raw.kitchenArea === "string" ? raw.kitchenArea.slice(0, 8) : "",
      wardrobeArea: typeof raw.wardrobeArea === "string" ? raw.wardrobeArea.slice(0, 8) : "",
      workArea: typeof raw.workArea === "string" ? raw.workArea.slice(0, 8) : "",
      renovationTier: renovationPackages.some((tier) => tier.id === raw.renovationTier)
        ? raw.renovationTier
        : "",
    };
  } catch {
    return null;
  }
}
