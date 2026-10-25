import { approvedRateBook, type RateBook } from "./estimate.ts";
import { materialBrands } from "./material-brands.ts";
import { commercialSpaceType } from "./welcome.ts";

const materialDirections = new Set([
  "Warm & grounded",
  "Calm & collected",
  "Soft & natural",
  ...materialBrands.map((brand) => brand.name),
]);

export function quoteMaterial(value: unknown) {
  return typeof value === "string" && value.length <= 80 && materialDirections.has(value)
    ? value
    : undefined;
}

export function quoteEntryStep(search: {
  scope?: string;
  module?: string;
  room?: string;
  commercial?: string;
}) {
  const scope = quoteScope(search);
  return scope && (scope !== "Commercial space" || commercialSpaceType(search.commercial)) ? 1 : 0;
}

export function pricingIsReady(book: RateBook = approvedRateBook, now = new Date()) {
  const expiry = Date.parse(book.validUntil + "T23:59:59Z");
  return !!(
    book.approved &&
    book.rates.length &&
    book.taxNote.trim() &&
    Number.isFinite(expiry) &&
    expiry >= now.getTime()
  );
}

export function planningJourney() {
  return pricingIsReady()
    ? {
        label: "Estimate my budget",
        title: "Plan your interiors budget",
        note: "An indicative range based on your selections. Final scope and price need a studio review.",
      }
    : {
        label: "Plan my interiors",
        title: "Plan your interiors",
        note: "Review your scope without contact details. The studio provides pricing after a review; this planner does not give an instant price.",
      };
}

export function quoteScope(search: { scope?: string; module?: string; room?: string }) {
  if (search.scope === "Commercial space") return "Commercial space";
  if (search.module === "Kitchen" || search.module === "Wardrobes") return search.module;
  if (search.room) return "Selected rooms";
  if (
    [
      "Whole home",
      "Kitchen",
      "Wardrobes",
      "Renovation",
      "Need guidance",
      "Selected rooms",
    ].includes(search.scope || "")
  )
    return search.scope!;
  if (search.scope === "Modular interiors") return "Kitchen & wardrobes";
  return "";
}
